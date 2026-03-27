"use client";
import { useState, useEffect } from "react";
import { Mail, Cake } from "lucide-react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const LettersInner = dynamic(() => import("./LettersInner"), { ssr: false });
const BirthdayLettersInner = dynamic(() => import("./BirthdayLettersInner"), { ssr: false });

interface Props {
  familyId: string;
  defaultTab?: "letters" | "birthday";
}

export default function CombinedLettersClient({ familyId, defaultTab = "letters" }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"letters" | "birthday">(
    searchParams.get("tab") === "birthday" ? "birthday" : defaultTab
  );

  return (
    <div>
      {/* Tab switcher */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 40,
        borderBottom: "1px solid var(--border)",
      }}>
        {([
          { key: "letters" as const, label: "Letters", icon: Mail },
          { key: "birthday" as const, label: "Birthday Letters", icon: Cake },
        ]).map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 20px",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: -1,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--green)" : "var(--text-3)",
                fontFamily: "var(--font-body)",
                transition: "color 160ms",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "letters" && <LettersInner familyId={familyId} />}
      {tab === "birthday" && <BirthdayLettersInner familyId={familyId} />}
    </div>
  );
}
