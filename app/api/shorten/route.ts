import { NextResponse } from "next/server";

const TINYURL_URL = "https://tinyurl.com/api-create.php";

async function shortenWithTinyUrl(url: string) {
  const endpoint = `${TINYURL_URL}?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`TinyURL failed with status ${response.status}.`);
  }

  const text = (await response.text()).trim();
  if (!text.startsWith("http")) {
    throw new Error("TinyURL response is invalid.");
  }
  return text;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const rawUrl = body.url;

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only http(s) URLs are supported." }, { status: 400 });
    }

    const shortUrl = await shortenWithTinyUrl(rawUrl);
    return NextResponse.json({
      shortUrl,
      providerUsed: "tinyurl"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to shorten URL.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
