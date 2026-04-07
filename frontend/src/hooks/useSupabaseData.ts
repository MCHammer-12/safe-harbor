import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null })
  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: (err as Error).message })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

// ---- Impact Dashboard ----

export interface ImpactSummary {
  girlsSupported: number
  safehouses: number
  donors: number
}

export function useImpactSummary() {
  return useAsync<ImpactSummary>(async () => {
    const [residents, safehouses, supporters] = await Promise.all([
      supabase.from('residents').select('*', { count: 'exact', head: true }),
      supabase.from('safehouses').select('*', { count: 'exact', head: true }),
      supabase.from('supporters').select('*', { count: 'exact', head: true }),
    ])
    if (residents.error) throw residents.error
    if (safehouses.error) throw safehouses.error
    if (supporters.error) throw supporters.error
    return {
      girlsSupported: residents.count ?? 0,
      safehouses: safehouses.count ?? 0,
      donors: supporters.count ?? 0,
    }
  })
}

export interface OutcomeRow {
  label: string
  pct: number
}

export function useOutcomeDistribution() {
  return useAsync<OutcomeRow[]>(async () => {
    const { data, error } = await supabase
      .from('residents')
      .select('reintegration_status')
    if (error) throw error
    const total = data?.length ?? 0
    if (total === 0) return []
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const key = (row.reintegration_status as string | null) || 'Unknown'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  })
}

// ---- Admin Dashboard ----

export interface KpiCards {
  activeResidents: number
  recentDonationsAmount: number
  upcomingReviews: number
  avgProgress: number
}

export function useAdminKpis() {
  return useAsync<KpiCards>(async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    const [activeRes, recentDon, edu] = await Promise.all([
      supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'Active'),
      supabase.from('donations').select('amount').gte('donation_date', sevenDaysAgo),
      supabase.from('education_records').select('progress_percent'),
    ])
    if (activeRes.error) throw activeRes.error
    if (recentDon.error) throw recentDon.error
    if (edu.error) throw edu.error

    const recentTotal = (recentDon.data ?? []).reduce(
      (sum, d) => sum + Number(d.amount ?? 0),
      0,
    )
    const progressVals = (edu.data ?? [])
      .map((r) => Number(r.progress_percent ?? 0))
      .filter((v) => !Number.isNaN(v))
    const avgProgress =
      progressVals.length > 0
        ? Math.round(progressVals.reduce((a, b) => a + b, 0) / progressVals.length)
        : 0

    return {
      activeResidents: activeRes.count ?? 0,
      recentDonationsAmount: recentTotal,
      upcomingReviews: 0, // TODO: no review/conference table to query
      avgProgress,
    }
  })
}

export interface SafehouseRow {
  name: string
  status: string
  occupied: number
  capacity: number
  pct: number
}

export function useSafehouses() {
  return useAsync<SafehouseRow[]>(async () => {
    const { data, error } = await supabase
      .from('safehouses')
      .select('name, status, current_occupancy, capacity_girls')
      .order('name')
    if (error) throw error
    return (data ?? []).map((s) => {
      const occupied = Number(s.current_occupancy ?? 0)
      const capacity = Number(s.capacity_girls ?? 0)
      const pct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
      return {
        name: s.name as string,
        status: ((s.status as string) || 'ACTIVE').toUpperCase(),
        occupied,
        capacity,
        pct,
      }
    })
  })
}

// ---- Caseload ----

export type ResidentStatus = 'Active' | 'In Progress' | 'Reintegrated' | 'At Risk'

export interface ResidentRow {
  id: string
  name: string
  category: string
  subCategory: string
  safehouse: string
  socialWorker: string
  status: ResidentStatus
}

function deriveSubCategory(r: Record<string, unknown>): string {
  const flags: Array<[string, string]> = [
    ['sub_cat_trafficked', 'Trafficked'],
    ['sub_cat_sexual_abuse', 'Sexual abuse'],
    ['sub_cat_physical_abuse', 'Physical abuse'],
    ['sub_cat_orphaned', 'Orphaned'],
    ['sub_cat_child_labor', 'Child labor'],
    ['sub_cat_osaec', 'OSAEC'],
    ['sub_cat_cicl', 'CICL'],
    ['sub_cat_at_risk', 'At risk'],
    ['sub_cat_street_child', 'Street child'],
    ['sub_cat_child_with_hiv', 'HIV+'],
  ]
  const hits = flags.filter(([k]) => r[k] === true).map(([, label]) => label)
  return hits.join(', ') || '—'
}

function normalizeStatus(s: string | null): ResidentStatus {
  if (!s) return 'Active'
  const lower = s.toLowerCase()
  if (lower.includes('reintegr')) return 'Reintegrated'
  if (lower.includes('risk')) return 'At Risk'
  if (lower.includes('progress') || lower.includes('open')) return 'In Progress'
  return 'Active'
}

export function useResidents() {
  return useAsync<ResidentRow[]>(async () => {
    const { data, error } = await supabase
      .from('residents')
      .select(
        'resident_id, internal_code, case_control_no, case_category, case_status, assigned_social_worker, sub_cat_trafficked, sub_cat_sexual_abuse, sub_cat_physical_abuse, sub_cat_orphaned, sub_cat_child_labor, sub_cat_osaec, sub_cat_cicl, sub_cat_at_risk, sub_cat_street_child, sub_cat_child_with_hiv, safehouses ( name )',
      )
      .order('resident_id')
      .limit(60)
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      id: (r.internal_code as string) || (r.case_control_no as string) || `R${r.resident_id}`,
      name: (r.internal_code as string) || `Resident ${r.resident_id}`,
      category: (r.case_category as string) || '—',
      subCategory: deriveSubCategory(r),
      safehouse: r.safehouses?.name || '—',
      socialWorker: (r.assigned_social_worker as string) || '—',
      status: normalizeStatus(r.case_status as string | null),
    }))
  })
}
