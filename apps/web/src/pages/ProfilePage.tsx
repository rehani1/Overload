import { useAuth } from "../auth/useAuth";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { formatDecimal } from "../lib/format";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <SectionPanel title="Account">
          <div className="grid gap-3 text-sm">
            <ProfileRow label="Name" value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} />
            <ProfileRow label="Email" value={user?.email ?? "Not set"} />
            <ProfileRow label="Account ID" value={user?.id ?? "Not set"} />
          </div>
        </SectionPanel>

        <SectionPanel title="Mobile profile data">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <ProfileRow label="Current goal" value={user?.goal || "Not set"} />
            <ProfileRow label="Height" value={formatHeight(user?.heightInches)} />
            <ProfileRow
              label="Body weight"
              value={user ? `${formatDecimal(user.weightPounds)} lb` : "Not set"}
            />
            <ProfileRow label="Sex" value={formatSex(user?.sex)} />
            <ProfileRow label="Preferred unit" value={user?.unitPreference?.toUpperCase() ?? "Not set"} />
          </div>
        </SectionPanel>
      </div>
    </>
  );
}

type ProfileRowProps = {
  label: string;
  value: string;
};

function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <div className="rounded-lg border border-overload-border bg-overload-elevated px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-overload-muted">
        {label}
      </p>
      <p className="mt-2 break-words font-semibold text-overload-ink">{value}</p>
    </div>
  );
}

function formatHeight(heightInches: number | undefined) {
  if (!heightInches || heightInches <= 0) {
    return "Not set";
  }

  const feet = Math.floor(heightInches / 12);
  const inches = Math.round(heightInches % 12);

  return `${feet} ft ${inches} in`;
}

function formatSex(sex: string | undefined) {
  if (!sex) {
    return "Not set";
  }

  return sex.charAt(0).toUpperCase() + sex.slice(1);
}
