"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "zh", label: "简" },
  { code: "zh-TW", label: "繁" },
  { code: "ja", label: "日" },
  { code: "ko", label: "한" },
  { code: "es", label: "ES" }
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: string) {
    // pathname is like /en/ask?k=... — replace first segment
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/");
    startTransition(() => {
      router.replace(nextPath);
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-input bg-background p-0.5">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          onClick={() => switchLocale(code)}
          className={
            code === locale
              ? "rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background"
              : "rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
