import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AskClient from "./ask-client";

export default async function AskPage() {
  const t = await getTranslations("ask");
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-zinc-100 p-6 text-zinc-700">
          {t("loading")}
        </main>
      }
    >
      <AskClient />
    </Suspense>
  );
}
