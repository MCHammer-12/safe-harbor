import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ACQUISITION_CHANNELS,
  RELATIONSHIP_TYPES,
  SUPPORTER_STATUSES,
  SUPPORTER_TYPES,
} from '@/data/supporterRegistrationConstants';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';

type View = 'intro' | 'wizard1' | 'wizard2';

type LinkDonorLookupBody = {
  firstName: string;
  lastName: string;
};

type LinkDonorFullBody = LinkDonorLookupBody & {
  supporterType: string;
  organizationName?: string | null;
  relationshipType: string;
  region: string;
  country: string;
  phone: string;
  status: string;
  acquisitionChannel: string;
};

type LinkDonorResponse = {
  linked?: boolean;
  needsSupporterDetails?: boolean;
};

export default function StaffDonateInfoModal({
  open,
  onClose,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
}) {
  const { authSession, refreshAuthState } = useAuth();
  const [view, setView] = useState<View>('intro');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accountEmail = authSession.email ?? '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [supporterType, setSupporterType] = useState<(typeof SUPPORTER_TYPES)[number]>('MonetaryDonor');
  const [relationshipType, setRelationshipType] =
    useState<(typeof RELATIONSHIP_TYPES)[number]>('Local');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<(typeof SUPPORTER_STATUSES)[number]>('Active');
  const [acquisitionChannel, setAcquisitionChannel] =
    useState<(typeof ACQUISITION_CHANNELS)[number]>('Website');
  const [organizationName, setOrganizationName] = useState('');

  const requiresOrganizationName =
    view === 'wizard2' && supporterType === 'PartnerOrganization';

  useEffect(() => {
    if (!open) return;
    setView('intro');
    setError(null);
    setBusy(false);
    setFirstName('');
    setLastName('');
    setSupporterType('MonetaryDonor');
    setRelationshipType('Local');
    setRegion('');
    setCountry('');
    setPhone('');
    setStatus('Active');
    setAcquisitionChannel('Website');
    setOrganizationName('');
  }, [open]);

  if (!open) return null;

  async function runLookup() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!accountEmail.trim()) {
      setError('Your account has no email on file. Contact support to use the donor portal.');
      return;
    }
    setBusy(true);
    const body: LinkDonorLookupBody = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    const res = await apiPost<LinkDonorLookupBody, LinkDonorResponse>(
      '/api/auth/link-donor-profile',
      body,
    );
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.linked) {
      await refreshAuthState();
      onClose();
      onLinked();
      return;
    }
    if (res.data?.needsSupporterDetails) {
      setView('wizard2');
      return;
    }
    setError('Unexpected response from server.');
  }

  async function runCreateAndLink() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!accountEmail.trim()) {
      setError('Your account has no email on file. Contact support.');
      return;
    }
    if (requiresOrganizationName && !organizationName.trim()) {
      setError('Organization name is required for Partner Organization.');
      return;
    }
    setBusy(true);
    const body: LinkDonorFullBody = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      supporterType,
      relationshipType,
      region: region.trim(),
      country: country.trim(),
      phone: phone.trim(),
      status,
      acquisitionChannel,
      organizationName: supporterType === 'PartnerOrganization' ? organizationName.trim() : null,
    };
    const res = await apiPost<LinkDonorFullBody, LinkDonorResponse>(
      '/api/auth/link-donor-profile',
      body,
    );
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.linked) {
      await refreshAuthState();
      onClose();
      onLinked();
      return;
    }
    setError(res.data?.needsSupporterDetails ? 'Please complete all supporter fields.' : 'Could not link donor profile.');
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-donate-title"
        className="max-w-lg w-full max-h-[90svh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="staff-donate-title" className="text-xl font-serif text-foreground pr-2">
            {view === 'intro' && 'Donor portal'}
            {view === 'wizard1' && 'Match your supporter profile'}
            {view === 'wizard2' && 'Create supporter profile'}
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full border border-border hover:bg-muted transition-colors grid place-items-center"
            aria-label="Close"
          >
            <span className="text-lg leading-none text-foreground">×</span>
          </button>
        </div>

        {view === 'intro' && (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              The supporter <span className="text-foreground font-medium">donor dashboard</span> is only
              available for accounts with the{' '}
              <span className="text-foreground font-medium">Donor</span> role and a linked supporter record.
            </p>
            <p>
              As staff, you can log and manage donations in the admin area. To use the same login as a
              supporter, you can link or create your supporter profile below.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/donors"
                className="inline-flex justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
                onClick={onClose}
              >
                Donors &amp; contributions (admin)
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setView('wizard1');
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Use donor portal with this account
              </button>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs pt-1">
                <Link to="/register" className="underline text-foreground" onClick={onClose}>
                  Register a separate supporter account
                </Link>
                <Link to="/contact" className="underline text-foreground" onClick={onClose}>
                  Contact
                </Link>
              </div>
            </div>
          </div>
        )}

        {view === 'wizard1' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We match your account to a supporter using your{' '}
              <span className="text-foreground font-medium">first name</span>,{' '}
              <span className="text-foreground font-medium">last name</span>, and{' '}
              <span className="text-foreground font-medium">email</span> (from your login). If no record
              exists, we will ask for the same supporter details as on the registration page.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={accountEmail}
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">First name</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Last name</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setView('intro');
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runLookup()}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {view === 'wizard2' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No supporter matched those details. Complete your supporter profile (same fields as registration).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">First name</label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Last name</label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Supporter type</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={supporterType}
                onChange={(e) => setSupporterType(e.target.value as (typeof SUPPORTER_TYPES)[number])}
              >
                {SUPPORTER_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {supporterType === 'PartnerOrganization' && (
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Organization name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required={requiresOrganizationName}
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Relationship type
              </label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={relationshipType}
                onChange={(e) =>
                  setRelationshipType(e.target.value as (typeof RELATIONSHIP_TYPES)[number])
                }
              >
                {RELATIONSHIP_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Region</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Country</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Phone</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof SUPPORTER_STATUSES)[number])}
              >
                {SUPPORTER_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Acquisition channel
              </label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={acquisitionChannel}
                onChange={(e) =>
                  setAcquisitionChannel(e.target.value as (typeof ACQUISITION_CHANNELS)[number])
                }
              >
                {ACQUISITION_CHANNELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setView('wizard1');
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runCreateAndLink()}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Create profile & open donor portal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
