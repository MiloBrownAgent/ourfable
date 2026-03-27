import { Suspense } from "react";
import CombinedLettersClient from "./CombinedLettersClient";

export default async function LettersPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = await params;
  return (
    <Suspense>
      <CombinedLettersClient familyId={familyId} defaultTab="letters" />
    </Suspense>
  );
}
