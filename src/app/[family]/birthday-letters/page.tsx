import { redirect } from "next/navigation";

export default async function BirthdayLettersPage({ params }: { params: Promise<{ family: string }> }) {
  const { family } = await params;
  redirect(`/${family}/letters?tab=birthday`);
}
