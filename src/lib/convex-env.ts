function parseConvexDeploymentName(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [, deploymentName = trimmed] = trimmed.split(":");
  return deploymentName.trim() || null;
}

function parseConvexUrlDeploymentName(value: string): string | null {
  try {
    return new URL(value).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function assertConvexEnvConsistency(url: string) {
  const deploymentFromUrl = parseConvexUrlDeploymentName(url);
  const deploymentFromEnv = parseConvexDeploymentName(process.env.CONVEX_DEPLOYMENT);

  if (!deploymentFromUrl || !deploymentFromEnv || deploymentFromUrl === deploymentFromEnv) {
    return;
  }

  throw new Error(
    `Convex deployment mismatch: NEXT_PUBLIC_CONVEX_URL targets "${deploymentFromUrl}" but CONVEX_DEPLOYMENT targets "${deploymentFromEnv}".`
  );
}

export function getConvexCloudUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL.");
  }

  assertConvexEnvConsistency(url);
  return url;
}

export function getConvexSiteUrl(): string {
  const cloudUrl = getConvexCloudUrl();
  return cloudUrl.replace(".convex.cloud", ".convex.site");
}
