# APEX Investment Valuation Engine
## Deployment Guide — Vercel (Free, ~5 minutes)

---

### What this does
Your Finnhub API key lives **only** on Vercel's servers as a secret environment
variable. The browser never sees it. Every visitor to your site hits your
`/api/finnhub` proxy endpoint, which adds the key server-side before
forwarding to Finnhub.

---

### Step 1 — Get a free Finnhub API key

1. Go to **https://finnhub.io/register**
2. Sign up with your email (no credit card needed)
3. After confirming your email, go to **https://finnhub.io/dashboard**
4. Copy your **API Key** (looks like: `cv1abc2def3ghi4jkl5`)
5. Keep this safe — you'll paste it into Vercel in Step 3

**Free tier limits:** 60 API calls/minute, which supports many concurrent users
for this use case (each stock lookup uses 4 calls).

---

### Step 2 — Deploy to Vercel

**Option A — Vercel Dashboard (easiest, no terminal needed)**

1. Go to **https://vercel.com** and sign up / log in (free)
2. Click **"Add New Project"**
3. Choose **"Upload"** (you don't need GitHub)
4. Drag and drop the entire `apex-project` folder onto the upload area
5. Click **Deploy**

**Option B — Vercel CLI**

```bash
npm install -g vercel
cd apex-project
vercel deploy --prod
```

---

### Step 3 — Add your Finnhub API key as a secret

1. In the Vercel dashboard, open your deployed project
2. Go to **Settings → Environment Variables**
3. Click **"Add New"**
4. Set:
   - **Name:** `FINNHUB_API_KEY`
   - **Value:** *(paste your Finnhub key from Step 1)*
   - **Environment:** Production ✓, Preview ✓, Development ✓
5. Click **Save**
6. Go to **Deployments** → click the three dots on your latest deployment → **"Redeploy"**

That's it. Your site is live and the key is secure.

---

### Step 4 — Share your URL

Vercel gives you a free URL like `https://apex-investment-tool.vercel.app`.
You can also connect a custom domain in Settings → Domains.

---

### Project Structure

```
apex-project/
├── api/
│   └── finnhub.js        ← Serverless proxy (never exposes your key)
├── public/
│   └── index.html        ← The full investment valuation app
├── vercel.json           ← Routing config
├── package.json
└── README.md
```

---

### Security notes

- Your API key is stored as an encrypted environment variable on Vercel
- The proxy only allows 5 specific Finnhub endpoints (allowlisted)
- All other paths return a 403 error, preventing misuse
- Responses are cached for 60 seconds to reduce API call usage
- You can monitor usage at https://finnhub.io/dashboard

---

### Troubleshooting

| Problem | Fix |
|---|---|
| "FINNHUB_API_KEY environment variable is not set" | Add the env var in Vercel Settings and redeploy |
| Ticker not found | Check the symbol is a valid US stock (NYSE/NASDAQ) |
| Some fields show N/A | Normal for stocks with no dividends or limited filing history |
| Rate limit errors | Finnhub free tier allows 60 calls/min — should be fine for personal use |
