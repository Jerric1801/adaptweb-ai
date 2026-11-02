/**
 * Price parsing and detection utilities.
 */
import type { PriceHit } from "../shared/contracts";

export interface ParsedAmount {
  raw: string;
  value: number; // in major units (e.g. 129.99)
  currency: string; // "USD", "EUR", "GBP", etc.
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "¥": "JPY",
  "A$": "AUD",
  "C$": "CAD",
};

/**
 * Parses currency and amount from arbitrary string.
 * Supports "$1,299.99", "1.299,99 €", "£49", "USD 12.50", "129.99 USD".
 */
export function parsePrice(text: string): ParsedAmount | null {
  if (!text) return null;
  const clean = text.trim();

  // Try currency symbol or code
  let currency = "USD";
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (clean.includes(sym)) {
      currency = code;
      break;
    }
  }
  const codeMatch = clean.match(/\b(USD|EUR|GBP|CAD|AUD|JPY)\b/i);
  if (codeMatch) {
    currency = codeMatch[1].toUpperCase();
  }

  // 1. Symbol/code directly before amount: $129.99, $ 1,299.99, USD 12.50
  const symPrefixMatch = clean.match(/(?:[$£€]|USD|EUR|GBP|CAD|AUD|JPY)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (symPrefixMatch) {
    let numStr = symPrefixMatch[1];
    if (numStr.includes(",") && !numStr.includes(".")) {
      numStr = numStr.replace(",", ".");
    } else {
      numStr = numStr.replace(/,/g, "");
    }
    const val = parseFloat(numStr);
    if (!isNaN(val)) return { raw: symPrefixMatch[0].trim(), value: val, currency };
  }

  // 2. Symbol/code directly after amount: 129,99 €, 12.50 USD
  const symSuffixMatch = clean.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:[$£€]|USD|EUR|GBP|CAD|AUD|JPY)/i);
  if (symSuffixMatch) {
    let numStr = symSuffixMatch[1];
    if (numStr.includes(",") && !numStr.includes(".")) {
      numStr = numStr.replace(",", ".");
    } else {
      numStr = numStr.replace(/,/g, "");
    }
    const val = parseFloat(numStr);
    if (!isNaN(val)) return { raw: symSuffixMatch[0].trim(), value: val, currency };
  }

  // 3. European format: 1.299,99 or 129,99
  const euroMatch = clean.match(/(?:^|[^\d])(\d{1,3}(?:\.\d{3})*,\d{2})(?:[^\d]|$)/);
  if (euroMatch) {
    const numStr = euroMatch[1].replace(/\./g, "").replace(",", ".");
    const val = parseFloat(numStr);
    if (!isNaN(val)) return { raw: euroMatch[1], value: val, currency };
  }

  // 4. US/Standard format: 1,299.99 or 129.99 or 129
  const usMatch = clean.match(/(?:^|[^\d])(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?:[^\d]|$)/);
  if (usMatch) {
    const numStr = usMatch[1].replace(/,/g, "");
    const val = parseFloat(numStr);
    if (!isNaN(val)) return { raw: usMatch[1], value: val, currency };
  }

  return null;
}

export function detectPriceKind(el: Element, text: string): PriceHit["kind"] {
  const combined = (text + " " + (el.className || "") + " " + (el.parentElement?.textContent || ""))
    .toLowerCase()
    .slice(0, 300);

  if (
    el.tagName.toLowerCase() === "s" ||
    el.tagName.toLowerCase() === "del" ||
    window.getComputedStyle?.(el)?.textDecorationLine?.includes("line-through") ||
    /\b(was|original|regular|strikethrough|before|reduced\s+from|msrp)\b/i.test(combined)
  ) {
    return "was";
  }

  if (/\b(shipping|delivery|postage|freight)\b/i.test(combined)) {
    return "shipping";
  }

  if (/\b(fee|service|booking|processing|convenience|facility|handling|surcharge)\b/i.test(combined)) {
    return "fee";
  }

  if (/\b(tax|taxes|vat|gst)\b/i.test(combined)) {
    return "tax";
  }

  if (/\b(total|subtotal|true total|order total|grand total)\b/i.test(combined)) {
    return "total";
  }

  if (/\b(add-on|addon|protect|warranty|care plan|insurance)\b/i.test(combined)) {
    return "addon";
  }

  return "item";
}

/**
 * Finds headline price from JSON-LD, meta itemprop, or DOM hierarchy.
 */
export function findHeadlinePrice(
  doc: Document,
): { value: number; currency: string; selector?: string } | null {
  // 1. JSON-LD Product/Offer
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(scripts)) {
    try {
      const data = JSON.parse(script.textContent || "{}");
      const findInObj = (obj: any): { value: number; currency: string } | null => {
        if (!obj || typeof obj !== "object") return null;
        if (obj["@type"] === "Product" || obj.offers) {
          const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
          if (offers && offers.price !== undefined) {
            const p = parseFloat(String(offers.price));
            if (!isNaN(p)) {
              return { value: p, currency: offers.priceCurrency || "USD" };
            }
          }
        }
        return null;
      };

      if (Array.isArray(data)) {
        for (const item of data) {
          const res = findInObj(item);
          if (res) return res;
        }
      } else {
        const res = findInObj(data);
        if (res) return res;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. meta itemprop="price" or [itemprop="price"]
  const itempropMeta = doc.querySelector('meta[itemprop="price"]');
  if (itempropMeta) {
    const val = parseFloat(itempropMeta.getAttribute("content") || "");
    const curr = doc.querySelector('meta[itemprop="priceCurrency"]')?.getAttribute("content") || "USD";
    if (!isNaN(val)) return { value: val, currency: curr };
  }

  const itempropEl = doc.querySelector('[itemprop="price"]');
  if (itempropEl) {
    const parsed = parsePrice(itempropEl.textContent || "");
    if (parsed) return { value: parsed.value, currency: parsed.currency };
  }

  // 3. Fallback: scan candidate price elements near h1
  const h1 = doc.querySelector("h1");
  const searchRoot = h1?.closest("main, .product, article, [role='main']") || doc.body;
  if (!searchRoot) return null;

  const priceEls = searchRoot.querySelectorAll(
    ".price, .current-price, [class*='price'], span, strong, div, p",
  );
  let bestHit: { el: Element; parsed: ParsedAmount; fontSize: number } | null = null;

  for (const el of Array.from(priceEls)) {
    // Only check direct text nodes or short text
    const text = el.textContent?.trim() || "";
    if (text.length > 25 || !/[$£€]|\bUSD\b|\bEUR\b|\bGBP\b/.test(text)) continue;

    const kind = detectPriceKind(el, text);
    if (kind === "was" || kind === "shipping" || kind === "fee" || kind === "tax") continue;

    const parsed = parsePrice(text);
    if (!parsed || parsed.value <= 0) continue;

    let fontSize = 16;
    try {
      const style = window.getComputedStyle(el);
      fontSize = parseFloat(style.fontSize) || 16;
    } catch {
      // fallback
    }

    if (!bestHit || fontSize > bestHit.fontSize) {
      bestHit = { el, parsed, fontSize };
    }
  }

  if (bestHit) {
    return {
      value: bestHit.parsed.value,
      currency: bestHit.parsed.currency,
    };
  }

  return null;
}
