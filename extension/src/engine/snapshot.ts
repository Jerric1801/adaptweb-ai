/**
 * Snapshot generator for sending to Supabase analyze-page.
 * Redacted: NO input values, NO emails/phones, text ≤ 160 chars, max 250 nodes.
 */
import type { PageSnapshot, PriceHit, SnapshotFlag, SnapshotNode } from "../shared/contracts";
import { detectPriceKind, parsePrice } from "./price";
import { uniqueSelector } from "./selector";

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

function sanitizeText(raw: string): string {
  if (!raw) return "";
  let clean = raw.replace(/\s+/g, " ").trim();
  clean = clean.replace(EMAIL_REGEX, "[EMAIL]");
  clean = clean.replace(PHONE_REGEX, "[PHONE]");
  return clean.slice(0, 160);
}

function getNodeAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    const name = attr.name.toLowerCase();
    if (
      name === "id" ||
      name === "class" ||
      name === "role" ||
      name === "aria-label" ||
      name === "aria-expanded" ||
      name === "aria-checked" ||
      name.startsWith("data-")
    ) {
      attrs[name] = attr.value.slice(0, 80);
    }
  }
  return attrs;
}

export function snapshot(doc: Document): PageSnapshot {
  const url = typeof location !== "undefined" ? location.origin + location.pathname : "";
  const domain = typeof location !== "undefined" ? location.hostname.replace(/^www\./, "") : "";
  const path = typeof location !== "undefined" ? location.pathname : "";
  const title = doc.title.slice(0, 160);
  const lang = doc.documentElement.lang || "en";

  const prioritizedElements = new Set<Element>();
  const elementFlags = new Map<Element, Set<SnapshotFlag>>();

  function addFlag(el: Element, flag: SnapshotFlag) {
    let set = elementFlags.get(el);
    if (!set) {
      set = new Set<SnapshotFlag>();
      elementFlags.set(el, set);
    }
    set.add(flag);
    prioritizedElements.add(el);
  }

  // Priority 1: Text-matching regexes
  const textPatternRegex = {
    has_timer_text: /(ends?|ending|expires?|hurry|sale ends|offer ends|deal ends|left in|flash sale|\b\d{1,2}:\d{2}\b)/i,
    has_scarcity_text: /(only\s+\d+\s+(left|remaining|in stock)|selling fast|almost gone|low stock|last chance|\b\d+\s+(rooms?|seats?|tickets?)\s+left)/i,
    has_social_proof_text: /(\d+\s+(people|others|shoppers|travell?ers|users)\s+(are\s+)?(viewing|looking|watching)|(just|recently)\s+(bought|booked|purchased)|booked\s+\d+\s+times)/i,
  };

  const walker = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_ELEMENT);
  let curr = walker.nextNode() as Element | null;

  while (curr) {
    const tag = curr.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "noscript") {
      curr = walker.nextNode() as Element | null;
      continue;
    }

    // Never read input values!
    let directText = "";
    if (tag !== "input" && tag !== "textarea" && tag !== "select") {
      directText = curr.textContent || "";
    }

    if (directText) {
      if (textPatternRegex.has_timer_text.test(directText)) {
        addFlag(curr, "has_timer_text");
      }
      if (textPatternRegex.has_scarcity_text.test(directText)) {
        addFlag(curr, "has_scarcity_text");
      }
      if (textPatternRegex.has_social_proof_text.test(directText)) {
        addFlag(curr, "has_social_proof_text");
      }
      if (/[$£€]|\bUSD\b|\bEUR\b|\bGBP\b/.test(directText) && directText.length < 50) {
        addFlag(curr, "has_price");
      }
    }

    // Priority 2: Checked checkboxes
    if (
      (tag === "input" && (curr as HTMLInputElement).type === "checkbox" && (curr as HTMLInputElement).checked) ||
      curr.getAttribute("aria-checked") === "true"
    ) {
      addFlag(curr, "checkbox_checked");
      if (curr.parentElement) {
        addFlag(curr.parentElement, "checkbox_checked");
      }
    }

    // Priority 3: Fixed/sticky overlays & modals
    let pos = "";
    try {
      pos = window.getComputedStyle(curr).position;
    } catch {
      // ignore
    }
    if (pos === "fixed" || pos === "sticky") {
      addFlag(curr, "is_fixed");
    }
    if (
      curr.getAttribute("role") === "dialog" ||
      curr.classList.contains("modal") ||
      curr.classList.contains("modal-overlay") ||
      curr.id.toLowerCase().includes("modal")
    ) {
      addFlag(curr, "is_modal");
    }

    // Priority 4: Buttons/links with decline-ish text
    if (tag === "button" || curr.getAttribute("role") === "button") {
      addFlag(curr, "is_button");
    }
    if (tag === "a" || curr.getAttribute("role") === "link") {
      addFlag(curr, "is_link");
    }

    // Priority 6: Collapsed sections containing tables/dl
    if (
      (tag === "details" && !(curr as HTMLDetailsElement).open) ||
      curr.getAttribute("aria-expanded") === "false"
    ) {
      addFlag(curr, "is_collapsed");
    }
    if (tag === "table" || tag === "dl") {
      addFlag(curr, "is_table");
    }

    // Priority 7: Headline elements
    if (tag === "h1" || tag === "h2") {
      prioritizedElements.add(curr);
    }

    curr = walker.nextNode() as Element | null;
  }

  // Collect up to 250 nodes
  const nodes: SnapshotNode[] = [];
  const prices: PriceHit[] = [];

  for (const el of prioritizedElements) {
    if (nodes.length >= 250) break;
    const tag = el.tagName.toLowerCase();

    // Redacted text: NEVER READ INPUT VALUES
    let text = "";
    if (tag !== "input" && tag !== "textarea" && tag !== "select") {
      // Deepest meaningful text snippet
      text = sanitizeText(el.textContent || "");
    }

    const sel = uniqueSelector(el, doc);
    const flags = Array.from(elementFlags.get(el) || []);

    nodes.push({
      selector: sel,
      tag,
      text,
      attrs: getNodeAttributes(el),
      flags,
    });

    // Check if this node has a price hit
    if (flags.includes("has_price")) {
      const parsed = parsePrice(text);
      if (parsed) {
        prices.push({
          selector: sel,
          text: parsed.raw,
          value: parsed.value,
          currency: parsed.currency,
          kind: detectPriceKind(el, text),
        });
      }
    }
  }

  return {
    url,
    domain,
    path,
    title,
    lang,
    nodes,
    prices,
  };
}
