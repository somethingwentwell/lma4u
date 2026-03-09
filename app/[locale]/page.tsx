"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronUp, Copy, Link2, Scissors } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSwitcher } from "@/components/language-switcher";
import { encodeBase64Url } from "@/lib/base64";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const t = useTranslations("home");

  const [question, setQuestion] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isShortening, setIsShortening] = useState(false);
  const [isCreateCollapsed, setIsCreateCollapsed] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  const generatedUrl = useMemo(() => shortUrl || shareUrl, [shareUrl, shortUrl]);
  const hasGenerated = Boolean(shareUrl);
  const previewUrl = useMemo(() => {
    if (!shareUrl) {
      return "";
    }
    const url = new URL(shareUrl);
    url.searchParams.set("autoplay", "0");
    return url.toString();
  }, [shareUrl]);

  function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShortUrl("");
    setCopied(false);

    const trimmed = question.trim();
    if (!trimmed) {
      setError(t("create.errorEmpty"));
      return;
    }

    const token = encodeBase64Url(trimmed);
    const origin = window.location.origin;
    const locale = window.location.pathname.split("/")[1];
    const link = `${origin}/${locale}/ask?k=${token}&autoplay=1`;
    setShareUrl(link);
    setIsCreateCollapsed(true);
    setIsOutputExpanded(true);
  }

  async function handleShorten() {
    if (!shareUrl) {
      setError(t("create.errorGenerateFirst"));
      return;
    }

    setError("");
    setIsShortening(true);

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: shareUrl
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        shortUrl?: string;
      };

      if (!response.ok || !payload.shortUrl) {
        throw new Error(payload.error || t("output.errorShortenFailed"));
      }

      setShortUrl(payload.shortUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("output.errorShortenFailed"));
    } finally {
      setIsShortening(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) {
      return;
    }

    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="grain min-h-screen py-10">
      <div className="mx-auto grid w-[min(920px,92vw)] gap-6">
        <section className="flex items-start justify-between px-1">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("heading")}</h1>
            <p className="mt-2 max-w-[68ch] text-sm text-muted-foreground">{t("subheading")}</p>
          </div>
          <LanguageSwitcher />
        </section>

        <Card className="border-black/10">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("create.title")}</CardTitle>
              {hasGenerated ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setIsCreateCollapsed((value) => !value)}
                >
                  {isCreateCollapsed ? (
                    <>
                      {t("create.expand")} <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {t("create.collapse")} <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          {isCreateCollapsed ? (
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("create.questionSaved")}</p>
              <p className="rounded-md border border-input bg-background px-3 py-2 text-sm">{question}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsCreateCollapsed(false)}
              >
                {t("create.editQuestion")}
              </Button>
            </CardContent>
          ) : (
            <CardContent>
              <form className="grid gap-4" onSubmit={handleGenerate}>
                <div className="grid gap-2">
                  <Label htmlFor="question">{t("create.questionLabel")}</Label>
                  <Textarea
                    id="question"
                    placeholder={t("create.questionPlaceholder")}
                    rows={4}
                    maxLength={500}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button type="submit" className="w-full sm:w-auto">
                    {t("create.generateBtn")}
                  </Button>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setQuestion("")}>
                    {t("create.clearBtn")}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {hasGenerated ? (
          <Card className="border-black/10">
            <CardHeader>
              <CardTitle>{t("animation.title")}</CardTitle>
              <CardDescription>{t("animation.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-input">
                <iframe
                  src={previewUrl}
                  title={t("animation.iframeTitle")}
                  className="h-[520px] w-full bg-zinc-950 sm:h-[640px]"
                  loading="lazy"
                />
              </div>
              <a
                href={generatedUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  className: cn("w-full sm:w-auto", !generatedUrl ? "pointer-events-none opacity-50" : "")
                })}
              >
                <Link2 className="mr-2 h-4 w-4" />
                {t("animation.openBtn")}
              </a>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-black/10">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("output.title")}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!hasGenerated}
                onClick={() => setIsOutputExpanded((value) => !value)}
              >
                {isOutputExpanded ? (
                  <>
                    {t("create.collapse")} <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t("create.expand")} <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {isOutputExpanded ? (
              <CardDescription className="max-w-none sm:max-w-[70%]">
                {t("output.description")}
              </CardDescription>
            ) : null}
          </CardHeader>
          {isOutputExpanded ? (
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="share-url">{t("output.shareUrlLabel")}</Label>
                <Input id="share-url" value={generatedUrl} readOnly placeholder={t("output.shareUrlPlaceholder")} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white text-black hover:bg-zinc-100 sm:w-auto"
                  onClick={handleShorten}
                  disabled={!shareUrl || isShortening}
                >
                  <Scissors className="mr-2 h-4 w-4" />
                  {isShortening ? t("output.shorteningBtn") : t("output.shortenBtn")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCopy}
                  disabled={!generatedUrl}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? t("output.copiedBtn") : t("output.copyBtn")}
                </Button>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
