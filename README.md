# lma4u (Let Me Ask AI For You)

Vercel-ready Next.js app that:

1. Accepts a question.
2. Encodes it in base64url (`k=`) for shared links.
3. Shortens links via TinyURL.
4. Plays a Grok-like animation.
5. Redirects to the real Grok query URL:
   `https://grok.com/?q=YOUR_QUESTION`

## Stack

- Next.js (App Router)
- Tailwind CSS
- shadcn-style UI components

## Local run

```bash
cd /Users/daddy/GitHub/lma4u
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

```bash
cd /Users/daddy/GitHub/lma4u
vercel --prod
```

## URL format

- Share page: `/ask?k=BASE64URL_TOKEN&autoplay=1`
- `k`: base64url encoded question
- `autoplay`: optional (`1` default, `0` disables timed redirect)

## Notes

- Base64 is obfuscation, not encryption.
- The destination still uses Grok format:
  `https://grok.com/?q=${encodeURIComponent(question)}`
