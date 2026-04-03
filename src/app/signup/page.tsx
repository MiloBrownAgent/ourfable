import { Suspense } from "react";
import SignupClient from "./SignupClient";
import { internalConvexQuery } from "@/lib/convex-internal";

type SignupSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type PlanType = "standard" | "plus";

function firstString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function normalizePlanType(value: unknown): PlanType | undefined {
  return value === "standard" || value === "plus" ? value : undefined;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SignupSearchParams;
}) {
  const params = await searchParams;
  const email = firstString(params.email)?.trim().toLowerCase();
  const waitlistEntry = email
    ? await internalConvexQuery<{
        childName?: string;
        requestedPlanType?: string;
      } | null>("ourfable:getWaitlistEntryByEmail", { email }).catch(() => null)
    : null;

  const initialEmail = email ?? "";
  const initialChildName = firstString(params.child)?.trim() || waitlistEntry?.childName?.trim() || "";
  const initialPlanType = normalizePlanType(waitlistEntry?.requestedPlanType);

  return (
    <Suspense>
      <SignupClient
        initialEmail={initialEmail}
        initialChildName={initialChildName}
        initialPlanType={initialPlanType}
      />
    </Suspense>
  );
}
