import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useMlDonorHighValueScores } from '@/hooks/useMlDonorHighValueScores';
import QuestionTooltip from '@/components/shared/QuestionTooltip';

type Props = {
  supporterNameById?: Record<number, string>;
  totalCount?: number;
};

const PAGE_SIZE = 10;

export default function MlDonorHighValuePanel({ supporterNameById, totalCount }: Props) {
  const [page, setPage] = useState(1);
  const { rows, loading, error } = useMlDonorHighValueScores(page, PAGE_SIZE);
  const sortedRows = useMemo(
    () =>
      [...(rows ?? [])].sort((a, b) => {
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        return b.highValueProbability - a.highValueProbability;
      }),
    [rows],
  );
  const canGoNext = !loading && sortedRows.length === PAGE_SIZE;
  const totalPages = totalCount != null && totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : null;

  useEffect(() => {
    if (error) return;
    if (!loading && sortedRows.length === 0 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  }, [error, loading, page, sortedRows.length]);

  return (
    <section
      className="rounded-2xl border border-border bg-white shadow-sm p-6 mb-8"
      aria-label="Live ML donor high-value scores"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">INSIGHTS - PREDICTIVE</p>
          <h2 className="text-xl font-serif text-foreground">Donor high-value propensity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Highlights supporters most likely to become high-value donors so your team can prioritize
            stewardship and personalized outreach.
          </p>
        </div>
        <Link to="/admin/ml-integration">
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
            View all ML integrations
          </span>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading scores...</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && sortedRows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No scores available yet. Verify ML service connectivity and the trained{' '}
          <code className="text-xs">donor_high_value_rf.joblib</code> artifact.
        </p>
      )}
      {!loading && sortedRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Supporter</th>
                <th className="py-2 pr-4">
                  High-value probability
                  <QuestionTooltip
                    label="What high-value probability means"
                    text="Use this as a ranking signal: focus your top stewardship efforts on the highest scores first, then move down the list as team capacity allows."
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.supporterId} className="border-b border-border/60">
                  <td className="py-2 pr-4">
                    {r.displayName ?? supporterNameById?.[r.supporterId] ?? `Supporter ${r.supporterId}`}
                  </td>
                  <td className="py-2 pr-4">
                    {r.error ? (
                      <span className="text-destructive text-xs">{r.error}</span>
                    ) : (
                      r.highValueProbability.toFixed(3)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <p />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span>
                Page {page}
                {totalPages ? ` / ${totalPages}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (totalPages ? page >= totalPages : !canGoNext)}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing {sortedRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {(page - 1) * PAGE_SIZE + sortedRows.length}
            {totalCount != null ? ` of ${totalCount}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}
