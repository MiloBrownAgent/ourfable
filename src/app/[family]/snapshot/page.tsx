import { redirect } from "next/navigation";

export default async function SnapshotPage({ params }: { params: Promise<{ family: string }> }) {
  const { family } = await params;
  redirect(`/${family}/born`);
}
