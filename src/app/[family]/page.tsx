import { convexQuery, calcAge, formatAgeLong } from "@/lib/convex";
import Link from "next/link";

import CountUpNumber from "@/components/CountUpNumber";
import WritingBlock from "@/components/WritingBlock";
import Greeting from "@/components/Greeting";
import DashboardChildAware from "./DashboardChildAware";

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
  borndayData?: { weatherHigh?: number; weatherDesc?: string; song?: string; songArtist?: string };
}

interface VaultEntry {
  _id: string;
  memberName: string;
  memberRelationship?: string;
  contentType: string;
  createdAt?: number;
  isSealed: boolean;
}

interface Snapshot {
  year: number;
  month: number;
  topHeadline?: string;
  topSong?: string;
}

interface Notification {
  _id: string;
  memberName: string;
  preview: string;
  createdAt: number;
  readAt?: number;
}

interface BeforeBorn {
  answer?: string;
}

export const dynamic = "force-dynamic";


function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function contentTypeLabel(type: string): string {
  return type === "voice" ? "Voice memo" : type === "photo" ? "Photo" : type === "video" ? "Video" : "Letter";
}

export default async function FamilyHub({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = await params;

  const [family, vaultEntries, snapshots, notifications, beforeBorn, circleMembers, outgoings, parentEntries] = await Promise.all([
    convexQuery<Family>("ourfable:getFamily", { familyId }).catch(() => null),
    convexQuery<VaultEntry[]>("ourfable:listVaultEntries", { familyId, includeSealed: true }).catch(() => [] as VaultEntry[]),
    convexQuery<Snapshot[]>("ourfable:listSnapshots", { familyId }).catch(() => [] as Snapshot[]),
    convexQuery<Notification[]>("ourfable:listNotifications", { familyId }).catch(() => [] as Notification[]),
    convexQuery<BeforeBorn[]>("ourfable:listBeforeBorn", { familyId }).catch(() => [] as BeforeBorn[]),
    convexQuery<Array<{ _id: string }>>( "ourfable:listCircle", { familyId }).catch(() => []),
    convexQuery<Array<{ sentAt: number }>>( "ourfable:listOutgoings", { familyId }).catch(() => []),
    convexQuery<Array<{ _id: string; authorName?: string; type?: string; isSealed?: boolean; createdAt?: number }>>( "ourfable:listOurFableVaultEntries", { familyId }).catch(() => []),
  ]);

  // beforeBorn used only for dedicated page; suppress unused warning
  void beforeBorn;
  const circleCount = (circleMembers ?? []).length;
  const lastDispatchAt = (outgoings ?? []).length > 0 ? (outgoings as Array<{ sentAt: number }>)[0]?.sentAt : undefined;

  // Merge circle contributions + parent entries for dashboard vault count
  const normalizedParentEntries: VaultEntry[] = (parentEntries ?? []).map((e) => ({
    _id: e._id,
    memberName: e.authorName ?? "Parent",
    memberRelationship: "Parent",
    contentType: (e.type === "text" ? "text" : e.type ?? "text") as "text",
    isSealed: e.isSealed ?? true,
    createdAt: e.createdAt,
  }));
  const allVaultEntries = [...(vaultEntries ?? []), ...normalizedParentEntries].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  if (!family) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Family not found.</p>
      </div>
    );
  }

  const { months, days, totalDays, weeks } = calcAge(family.childDob);
  const childFirst = family.childName.split(" ")[0];
  const ageLong = formatAgeLong(months, days);

  const now = new Date();
  const currentSnap = (snapshots ?? []).find(s => s.year === now.getFullYear() && s.month === now.getMonth() + 1)
    ?? (snapshots ?? []).sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))[0];

  const recentEntries = (vaultEntries ?? []).slice(0, 2);
  const totalVault = (vaultEntries ?? []).length;

  const unreadNotifs = (notifications ?? []).filter(n => !n.readAt).slice(0, 3);

  return (
    <>
      {/* ChildAware overlay: when 2+ children, shows selected child's data */}
      <DashboardChildAware
        familyId={familyId}
        defaultChildName={family.childName}
        defaultChildDob={family.childDob}
        defaultVaultEntries={allVaultEntries}
        defaultNotifications={notifications ?? []}
        currentSnap={currentSnap}
        unreadNotifs={unreadNotifs}
        circleCount={circleCount}
        lastDispatchAt={lastDispatchAt}
      />
    </>
  );
}
