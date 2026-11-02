// analyze-page: PageSnapshot -> validated SiteRuleSet (cache -> Gemini -> validate -> upsert)
import { createClient } from "npm:@supabase/supabase-js@2";
import type {
  AnalyzeResponse,
  PageSnapshot,
  PatternType,
  Rule,
  RuleAction,
  SiteRuleSet,
} from "../_shared/contracts.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PATTERNS: PatternType[] = [
  "fake_urgency", "false_scarcity", "fake_social_proof", "drip_pricing",
  "sneak_into_basket", "confirmshaming", "nagging_popup", "buried_specs", "clutter",
];
const ACTIONS: RuleAction[] = [
  "remove", "hide", "uncheck", "rewrite_text", "annotate_total", "surface", "dismiss",
];
const MODES = ["analytical", "minimalist", "visual"];
const MAX_NODES = 300;
const AI_TTL_MS = 7 * 24 * 3600 * 1000;
const BANNED_SELECTORS = new Set(["html", "body", "main", "header"]);

const SYSTEM_PROMPT = `You classify manipulative design ("dark patterns") on a web page from a redacted DOM snapshot.
Reply with a single JSON object {"rules": [...], "confidence": number} matching the response schema.

Rules:
- Output only rules whose "selector" is copied exactly from a snapshot node "selector" (annotate_total may instead use a snapshot "prices" selector).
- Pattern -> action mapping:
  - fake_urgency, false_scarcity, fake_social_proof -> action "remove"
  - sneak_into_basket -> action "uncheck" (selector must be the checkbox itself)
  - confirmshaming -> action "rewrite_text" with text "No thanks"
  - nagging_popup -> action "dismiss"
  - drip_pricing -> action "annotate_total" on the headline price; put extras such as fee_values and shipping_value in "extras" ONLY if stated on the page
  - buried_specs -> action "surface" with modes ["analytical"]
  - clutter (recommendation carousels, promo strips) -> action "hide" with modes ["minimalist"]
- Never invent prices. Never target html/body/main/header, the product title, or the add-to-cart button.
- Prefer precision over recall. Add a reason of at most 8 words per rule. Set confidence 0-1 per rule and overall.`;

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
      rules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pattern: { type: "string", enum: PATTERNS },
            selector: { type: "string" },
            action: { type: "string", enum: ACTIONS },
            reason: { type: "string" },
            text: { type: "string" },
            confidence: { type: "number" },
            modes: { type: "array", items: { type: "string", enum: MODES } },
            extras: {
              type: "object",
              properties: {
                shipping_selector: { type: "string" },
                fee_selectors: { type: "array", items: { type: "string" } },
                shipping_value: { type: "number" },
                fee_values: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { label: { type: "string" }, value: { type: "number" } },
                    required: ["label", "value"],
                  },
                },
                tax_rate: { type: "number" },
                currency: { type: "string" },
              },
            },
          },
          required: ["pattern", "selector", "action", "confidence"],
        },
      },
      confidence: { type: "number" },
    },
    required: ["rules", "confidence"],
};

function json(body: AnalyzeResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export function derivePathPattern(path: string): string {
  const seg = (path || "/").split("/").filter(Boolean)[0];
  return seg ? `/${seg}/*` : "*";
}

export function validateRules(raw: unknown, snapshot: PageSnapshot): Rule[] {
  if (!Array.isArray(raw)) return [];
  const nodeSel = new Set(snapshot.nodes.map((n) => n.selector));
  const priceSel = new Set((snapshot.prices ?? []).map((p) => p.selector));
  const out: Rule[] = [];
  for (const r of raw as Rule[]) {
    if (!r || typeof r.selector !== "string") continue;
    if (!PATTERNS.includes(r.pattern) || !ACTIONS.includes(r.action)) continue;
    if (BANNED_SELECTORS.has(r.selector.trim().toLowerCase())) continue;
    const known = nodeSel.has(r.selector) || (r.action === "annotate_total" && priceSel.has(r.selector));
    if (!known) continue;
    if (typeof r.confidence === "number" && r.confidence < 0.5) continue;
    if (r.modes) r.modes = r.modes.filter((m) => MODES.includes(m));
    out.push(r);
  }
  return out;
}

async function callGemini(snapshot: PageSnapshot, model: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(snapshot) }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
          responseJsonSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error(`empty gemini response (finish=${data.candidates?.[0]?.finishReason})`);
  return JSON.parse(text) as { rules: Rule[]; confidence: number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const t0 = Date.now();
  try {
    const body = await req.json();
    const snapshot: PageSnapshot | undefined = body?.snapshot;
    if (!snapshot?.domain) return json({ ruleSet: null, cached: false, error: "snapshot.domain required" });
    snapshot.nodes = (snapshot.nodes ?? []).slice(0, MAX_NODES);
    snapshot.prices = snapshot.prices ?? [];

    const domain = snapshot.domain.replace(/^www\./, "");
    const pathPattern = derivePathPattern(snapshot.path);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Object.entries(Deno.env.toObject()).find(([k]) => /SECRET_KEY|SERVICE_ROLE/.test(k))?.[1] ?? "";
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // --- cache ---
    const { data: existing } = await db
      .from("site_rules")
      .select("*")
      .eq("domain", domain)
      .in("path_pattern", [pathPattern, "*"])
      .in("source", ["curated", "ai"])
      .order("updated_at", { ascending: false });
    const rows = (existing ?? []) as SiteRuleSet[];
    const curated = rows.find((r) => r.source === "curated");
    if (curated) return json({ ruleSet: curated, cached: true, ms: Date.now() - t0 });
    const aiRow = rows.find((r) => r.source === "ai" && r.path_pattern === pathPattern);
    if (aiRow?.updated_at && Date.now() - new Date(aiRow.updated_at).getTime() < AI_TTL_MS) {
      return json({ ruleSet: aiRow, cached: true, ms: Date.now() - t0 });
    }

    // --- LLM ---
    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
    const out = await callGemini(snapshot, model);
    const rules = validateRules(out.rules, snapshot);

    // --- upsert ---
    const row = {
      domain,
      path_pattern: pathPattern,
      source: "ai" as const,
      rules,
      confidence: typeof out.confidence === "number" ? Math.min(1, Math.max(0, out.confidence)) : null,
      version: (aiRow?.version ?? 0) + 1,
    };
    const { data: saved, error } = await db
      .from("site_rules")
      .upsert(row, { onConflict: "domain,path_pattern,source" })
      .select()
      .single();
    if (error) throw new Error(`upsert: ${error.message}`);
    return json({ ruleSet: saved as SiteRuleSet, cached: false, model, ms: Date.now() - t0 });
  } catch (e) {
    return json({ ruleSet: null, cached: false, error: String((e as Error)?.message ?? e), ms: Date.now() - t0 });
  }
});
