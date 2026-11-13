# Filtrd website

The public site for Filtrd: a chat-first homepage with the hiring agent, a marketing page at `/about`, and a guided product tour at `/demo`. The agent and workspace run in the browser on sample data; the only server code is the waitlist endpoint.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
```

The waitlist form answers "Sign-ups aren't switched on yet" until Redis is configured.

## Deploy on Vercel

- Import the GitHub repo, choose the `website` branch, and set the root directory to `website`.
- Add Upstash Redis from the Vercel Marketplace and connect it to the project. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which `/api/waitlist` uses to store pilot requests.
