import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "zh-TW", "ja", "ko", "es"],
  defaultLocale: "en"
});
