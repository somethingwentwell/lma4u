"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronsLeft,
  Copy,
  Ellipsis,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Share2,
  SquareArrowOutUpRight,
  ThumbsDown,
  ThumbsUp,
  Volume2
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { decodeBase64Url } from "@/lib/base64";
import { cn } from "@/lib/utils";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function AskClient() {
  const t = useTranslations("ask");
  const params = useSearchParams();
  const token = params.get("k") || "";
  const autoplay = params.get("autoplay") !== "0";

  const [question, setQuestion] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const [typedAddress, setTypedAddress] = useState("");
  const [typedQuestion, setTypedQuestion] = useState("");
  const [inputQuestion, setInputQuestion] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [step, setStep] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCanceled, setAutoCanceled] = useState(false);

  // cursor animation
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);

  const stopAnimationRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetUrl = useMemo(() => {
    if (!question) {
      return "";
    }
    return `https://grok.com/?q=${encodeURIComponent(question)}`;
  }, [question]);

  useEffect(() => {
    if (!token) {
      setDecodeError(t("error.missingToken"));
      setQuestion("");
      return;
    }

    try {
      const decoded = decodeBase64Url(token).trim();
      if (!decoded) {
        throw new Error("Token decoded to empty string.");
      }
      setDecodeError("");
      setQuestion(decoded);
    } catch {
      setDecodeError(t("error.invalidToken"));
      setQuestion("");
    }
  }, [token, t]);

  useEffect(() => {
    if (!question) {
      return;
    }

    stopAnimationRef.current = false;
    setTypedAddress("");
    setTypedQuestion("");
    setInputQuestion("");
    setAssistantText("");
    setStep(0);
    setCountdown(null);
    setAutoCanceled(false);
    setCursorPos(null);
    setIsClicking(false);

    function getRelativeCenter(el: HTMLElement, container: HTMLElement) {
      const eRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      return {
        x: eRect.left - cRect.left + eRect.width / 2,
        y: eRect.top - cRect.top + eRect.height / 2
      };
    }

    async function moveCursor(x: number, y: number) {
      setCursorPos({ x, y });
      await wait(800);
    }

    async function click() {
      setIsClicking(true);
      await wait(300);
      setIsClicking(false);
      await wait(200);
    }

    async function typeText(full: string, setter: (value: string) => void, speed: number) {
      let current = "";
      for (const char of full) {
        if (stopAnimationRef.current) {
          return;
        }
        current += char;
        setter(current);
        await wait(speed);
      }
    }

    async function runAnimation() {
      await wait(260);
      if (stopAnimationRef.current) return;

      setStep(1);
      await typeText("https://grok.com", setTypedAddress, 34);
      await wait(280);
      if (stopAnimationRef.current) return;

      // move cursor to input area and click
      const section = sectionRef.current;
      const inputArea = inputAreaRef.current;
      if (section && inputArea) {
        const pos = getRelativeCenter(inputArea, section);
        await moveCursor(pos.x, pos.y);
        if (stopAnimationRef.current) return;
        await click();
      }

      setStep(2);
      await typeText(question, (v) => { setTypedQuestion(v); setInputQuestion(v); }, 60);
      await wait(320);
      if (stopAnimationRef.current) return;

      // move cursor to send button and click
      const sendBtn = sendBtnRef.current;
      if (section && sendBtn) {
        const pos = getRelativeCenter(sendBtn, section);
        await moveCursor(pos.x, pos.y);
        if (stopAnimationRef.current) return;
        await click();
      }

      setStep(3);
      setIsSending(true);
      await wait(900);
      setIsSending(false);
      setInputQuestion("");
      if (stopAnimationRef.current) return;

      // hide cursor after send
      setCursorPos(null);

      setAssistantText(t("chat.thinking"));
      await wait(1100);
      if (stopAnimationRef.current) return;

      setAssistantText(t("chat.ready"));
      setStep(4);

      if (!autoplay) {
        return;
      }

      setCountdown(5);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((value) => {
          if (value === null) {
            return null;
          }
          if (value <= 1) {
            return 0;
          }
          return value - 1;
        });
      }, 1000);

      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = targetUrl;
      }, 5000);
    }

    runAnimation();

    return () => {
      stopAnimationRef.current = true;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [autoplay, question, targetUrl, t]);

  function cancelAutoOpen() {
    setAutoCanceled(true);
    setCountdown(null);
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }

  const statusText = autoCanceled
    ? t("status.autoCanceled")
    : countdown !== null && autoplay
      ? t("status.openingIn", { countdown })
      : autoplay
        ? t("status.readyToOpen")
        : t("status.autoplayDisabled");

  if (decodeError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070707] p-6 text-zinc-100">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/85 p-6">
          <p className="text-sm uppercase tracking-[0.15em] text-zinc-500">{t("error.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-semibold">{t("error.heading")}</h1>
          <p className="mt-3 text-zinc-300">{decodeError}</p>
          <div className="mt-5 flex gap-3">
            <Link href="/" className={buttonVariants()}>
              {t("error.backBtn")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070707] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-[268px] flex-col border-r border-zinc-800 bg-[#050505] lg:flex">
          <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-3">
            <div
              aria-label="Grok"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100"
            >
              <svg viewBox="0 0 35 33" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576L33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436Z" />
                <path d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341Z" />
              </svg>
            </div>
            <button
              type="button"
              className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1 p-2 text-sm">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2 text-left text-zinc-100"
            >
              <Search className="h-4 w-4" />
              {t("sidebar.search")}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-zinc-300 transition hover:bg-zinc-900"
            >
              <MessageSquare className="h-4 w-4" />
              {t("sidebar.chat")}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-zinc-300 transition hover:bg-zinc-900"
            >
              <Mic className="h-4 w-4" />
              {t("sidebar.voice")}
            </button>
          </div>

          <div className="mt-2 border-t border-zinc-800 p-3 text-xs text-zinc-500">
            <div className="mb-2 flex items-center justify-between">
              <span>{t("sidebar.projects")}</span>
              <button
                type="button"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-300">{t("sidebar.newProject")}</div>
            <div className="mt-3 mb-2 flex items-center gap-1 text-zinc-500">
              <span>{t("sidebar.history")}</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </div>
          </div>

          <div className="mt-auto border-t border-zinc-800 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-zinc-300" />
              <span className="text-sm text-zinc-200">{t("sidebar.you")}</span>
            </div>
          </div>
        </aside>

        <section ref={sectionRef} className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
          {/* Cursor overlay */}
          {cursorPos ? (
            <div
              className="pointer-events-none absolute z-50"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transition: "left 0.7s cubic-bezier(0.4,0,0.2,1), top 0.7s cubic-bezier(0.4,0,0.2,1)"
              }}
            >
              {/* yellow glow halo */}
              <span className={cn(
                "absolute -left-4 -top-4 h-10 w-10 rounded-full bg-yellow-400/25 blur-sm transition-opacity duration-200",
                isClicking ? "opacity-100" : "opacity-60"
              )} />
              {isClicking ? (
                <span className="absolute -left-4 -top-4 h-10 w-10 animate-ping rounded-full bg-yellow-400/30" />
              ) : null}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                className={cn("relative drop-shadow-lg transition-transform duration-150", isClicking ? "scale-75" : "scale-100")}
              >
                <path
                  d="M4 2L4 18L8 14L11 20L13 19L10 13L15 13Z"
                  fill="white"
                  stroke="#333"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : null}

          <header className="absolute inset-x-0 top-0 z-20 h-16 border-b border-zinc-800/80 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent px-3 md:px-6">
            <div className="mx-auto flex h-full w-full max-w-[1020px] items-center justify-between">
              <div className="text-zinc-300">
                <svg viewBox="0 0 35 33" className="h-5 w-5 fill-current" aria-label="Grok">
                  <path d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576L33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436Z" />
                  <path d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341Z" />
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("header.shareBtn")}
                </button>
              </div>
            </div>
          </header>

          <div className="relative flex-1 overflow-y-auto px-3 pb-44 pt-20 md:px-6">
            <div className="mx-auto w-full max-w-[1020px]">
              <div className="mx-auto mb-6 w-fit rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300">
                {typedAddress || "https://grok.com"}
              </div>

              <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
                <div className="flex">
                  <div className="max-w-[90%] rounded-3xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
                    {t("chat.greeting")}
                  </div>
                </div>

                {step >= 3 ? (
                  <div className="flex justify-end">
                    <div className="max-w-[90%] rounded-3xl rounded-br-md border border-zinc-700 bg-zinc-100 px-4 py-3 text-sm text-zinc-900">
                      {typedQuestion}
                    </div>
                  </div>
                ) : null}

                {assistantText ? (
                  <div className="flex">
                    <div className="max-w-[90%] rounded-3xl rounded-bl-md px-2 py-1 text-sm text-zinc-200">
                      {assistantText === t("chat.thinking") ? (
                        <span className="inline-flex items-center gap-2 text-zinc-300">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("chat.thinking")}
                        </span>
                      ) : (
                        assistantText
                      )}
                    </div>
                  </div>
                ) : null}

                {step >= 4 ? (
                  <div className="flex items-center gap-1 text-zinc-500">
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition hover:bg-zinc-900 hover:text-zinc-200">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

          <div className="absolute inset-x-0 bottom-3 z-30 px-3 md:px-6">
            <div className="mx-auto w-full max-w-[1020px] space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-300">
                <span>{statusText}</span>
                <a
                  href={targetUrl || "#"}
                  target="_self"
                  rel="noreferrer"
                  className={buttonVariants({
                    size: "sm",
                    className: cn("h-8 rounded-full", !targetUrl ? "pointer-events-none opacity-50" : "")
                  })}
                >
                  <SquareArrowOutUpRight className="mr-1.5 h-3.5 w-3.5" />
                  {t("actions.openGrok")}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800"
                  onClick={cancelAutoOpen}
                  disabled={!countdown || autoCanceled}
                >
                  {t("actions.cancelAutoOpen")}
                </Button>
                <Link
                  href="/"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                    className: "h-8 rounded-full"
                  })}
                >
                  {t("actions.back")}
                </Link>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-zinc-700 bg-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                <div className="flex items-end gap-2 px-3 pb-3 pt-2">
                  <button
                    type="button"
                    className="mt-auto rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <div ref={inputAreaRef} className="min-h-14 flex-1 px-2 py-2 text-sm text-zinc-100">
                    {inputQuestion || <span className="text-zinc-500">{t("input.placeholder")}</span>}
                    {step < 2 ? <span className="animate-pulse text-zinc-500">|</span> : null}
                  </div>

                  <button
                    type="button"
                    className="mb-0.5 rounded-full px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                  >
                    {t("input.autoBtn")}
                  </button>

                  <button
                    type="button"
                    className="mb-0.5 rounded-full border border-zinc-700 p-2 text-zinc-200 transition hover:bg-zinc-800"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <button
                    ref={sendBtnRef}
                    type="button"
                    className={cn(
                      "mb-0.5 rounded-full border p-2.5 transition",
                      isSending
                        ? "animate-pulseBorder border-zinc-100 bg-zinc-100 text-zinc-900"
                        : "border-zinc-700 bg-zinc-100 text-zinc-900"
                    )}
                  >
                    <Rocket className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
