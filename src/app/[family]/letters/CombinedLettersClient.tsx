"use client";
import dynamic from "next/dynamic";

const LettersInner = dynamic(() => import("./LettersInner"), { ssr: false });

interface Props {
  familyId: string;
}

export default function CombinedLettersClient({ familyId }: Props) {
  return (
    <div>
      <LettersInner familyId={familyId} />
    </div>
  );
}
