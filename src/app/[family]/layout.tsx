import { Sidebar } from "@/components/sidebar";
import { ChildProvider } from "@/components/ChildContext";
import { convexQuery } from "@/lib/convex";

interface Family {
  childName: string;
  familyName: string;
}

export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ family: string }>;
}) {
  const { family: familyId } = await params;
  const family = await convexQuery<Family>("ourfable:getFamily", { familyId }).catch(() => null);

  const familyDisplayName = family?.familyName ?? familyId;
  const childFirst = family?.childName.split(" ")[0] ?? undefined;

  return (
    <ChildProvider familyId={familyId}>
      <Sidebar familyId={familyId} familyDisplayName={familyDisplayName} childFirst={childFirst} />
      <main
        style={{ paddingTop: 52, minHeight: "100vh" }}
        className="family-main"
      >
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 24px calc(80px + env(safe-area-inset-bottom, 0px))",
        }}>
          {children}
        </div>
      </main>
      <style>{`
        @media (min-width: 768px) {
          .family-main {
            padding-top: 0 !important;
            padding-left: 224px;
          }
        }
        /* Prevent content from hiding behind iOS home indicator */
        @supports (padding: max(0px)) {
          .family-main > div {
            padding-left: max(24px, env(safe-area-inset-left, 24px));
            padding-right: max(24px, env(safe-area-inset-right, 24px));
          }
        }
      `}</style>
    </ChildProvider>
  );
}
