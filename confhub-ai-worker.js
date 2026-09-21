/**
 * ConfHub AI assistant — Cloudflare Worker (OPTIONAL)
 *
 * Only needed if you want AI answers for questions the built-in
 * knowledge base can't handle. Without it, the assistant still works:
 * it answers common questions itself and hands the rest to WhatsApp.
 *
 * SETUP (about 15 minutes)
 *  1. console.anthropic.com → create an account → add a payment method
 *     → API Keys → Create key. Copy it.
 *  2. dash.cloudflare.com → Workers & Pages → Create → Worker
 *     → name it "confhub-ai" → Deploy → Edit code
 *  3. Replace everything with this file → Deploy
 *  4. Settings → Variables and Secrets → Add
 *        Type: Secret   Name: ANTHROPIC_API_KEY   Value: your key
 *  5. Copy the worker URL (https://confhub-ai.<you>.workers.dev)
 *     and paste it into AI_ENDPOINT at the top of assistant.js
 *
 * COST: Haiku is Anthropic's cheapest model. A typical website question
 * costs a fraction of a naira. Set a monthly spend limit in the Anthropic
 * console so it can never surprise you.
 */

const MODEL = "claude-haiku-4-5-20251001";
const ALLOWED_ORIGINS = ["https://confhub.ng", "https://www.confhub.ng"];

const SYSTEM = `You are the assistant on confhub.ng, the website of Conf Hub Solutions, a Nigerian company (registered under CAMA 2020, BN 9874084) that provides conference software to Nigerian scientific and professional associations.

What ConfHub does:
- Abstract submission with the association's own structure, word limit and categories; authors get an abstract number and a private edit link until the deadline.
- Blind peer review: two reviewers per abstract tap Yes or No; if they disagree an adjudicator decides. Reviewers never see authors or institutions, and are never given their own institution's work.
- Delegate registration with member, trainee, non-member and early-bird rates. Payment by card through the association's OWN Paystack account, or bank transfer with a unique reference. Money goes to the association; ConfHub never holds funds. Receipts are automatic.
- QR delegate passes by email. Stewards scan on their own phones. Works with no internet. Printed badges carry the same code.
- Daily check-in, so certificates go only to delegates who attended — making CPD claims defensible.
- The conference app: programme, speakers, abstracts, venue, announcements, live stream. Works offline. Edited from a spreadsheet.
- A live dashboard for the organising committee. Each member gets a personal link — no password. The chairman decides who sees what.
- A free directory of Nigerian conferences.

Pricing, per conference: Basic ₦399,000 (event app); Standard ₦599,000 (adds QR check-in, abstract listings, sponsors, feedback, certificates); Premium is custom (abstract review, online payment, large congresses). Most associations have a sponsor pay.

Contact: hello@confhub.ng, WhatsApp +234 813 214 9889.

Rules:
- Answer in 2 to 4 short sentences. Plain text, no markdown.
- Only answer questions about ConfHub and running conferences with it.
- If you do not know something, or the question is about a specific conference's dates, fees, deadlines or a delegate's own registration, say you can't see that and suggest they contact their conference organisers or message ConfHub on WhatsApp. Never invent dates, fees, or features.
- Never promise discounts, custom work, or timelines. Suggest a demo instead.
- If the question is unrelated to ConfHub, politely say you can only help with ConfHub.`;

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST")
      return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

    // Only our own site may use this — stops others spending your credit
    if (!ALLOWED_ORIGINS.includes(origin))
      return new Response(JSON.stringify({ handoff: true }), { status: 403, headers });

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ handoff: true }), { status: 400, headers }); }

    const messages = (body.messages || [])
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

    if (!messages.length || messages[messages.length - 1].role !== "user")
      return new Response(JSON.stringify({ handoff: true }), { headers });

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM, messages }),
      });
      if (!r.ok) return new Response(JSON.stringify({ handoff: true }), { headers });
      const data = await r.json();
      const reply = (data.content || [])
        .filter(b => b.type === "text").map(b => b.text).join("").trim();
      return new Response(JSON.stringify(reply ? { reply } : { handoff: true }), { headers });
    } catch {
      return new Response(JSON.stringify({ handoff: true }), { headers });
    }
  },
};
