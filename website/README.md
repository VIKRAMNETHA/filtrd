# Filtrd website

The public site for Filtrd: a chat-first homepage with the hiring agent, a marketing page at `/about`, and a guided product tour at `/demo`. Everything runs in the browser on sample data, so the site is static apart from the waitlist endpoint.

## Run locally

```bash
npm install
npm run build
npm run preview   # serves out/ with the waitlist function at http://localhost:8788
```

## Deploy on Cloudflare Pages

- Root directory: `website`
- Build command: `npm run build`
- Build output directory: `out`
- Bind a KV namespace named `WAITLIST` so `/api/waitlist` can store pilot requests.
