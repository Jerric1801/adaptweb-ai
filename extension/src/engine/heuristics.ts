/**
 * Heuristic detectors for dark patterns.
 * Runs locally with zero backend dependencies.
 */
import type { Rule } from "../shared/contracts";
import { parsePrice } from "./price";
import { uniqueSelector } from "./selector";

function isProtectedElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "h1" || tag === "body" || tag === "html" || tag === "main") return true;
  if (el.querySelector("h1")) return true;

  // Never remove primary add to cart or buy button
  if (tag === "button" || tag === "a" || el.getAttribute("role") === "button") {
    const text = el.textContent || "";
    if (/\b(add to cart|add to bag|buy now|checkout)\b/i.test(text)) {
      // unless it's a nagging popup button
      if (!el.closest('[role="dialog"], .modal, .modal-overlay, [class*="modal"]')) {
        return false; // let the button be protected
      }
    }
  }
  return false;
}

export function detect(doc: Document): Rule[] {
  const rules: Rule[] = [];
  const matchedSelectors = new Set<string>();

  function addRule(rule: Rule) {
    if (!rule.selector || matchedSelectors.has(rule.selector)) return;
    matchedSelectors.add(rule.selector);
    rules.push(rule);
  }

  // 1. FAKE URGENCY
  // /(ends?|ending|expires?|left|hurry|sale ends|offer ends|deal ends)[^]{0,40}\d{1,2}\s*[:h]\s*\d{2}/i
  const urgencyRegex = /(ends?|ending|expires?|left|hurry|sale ends|offer ends|deal ends|flash sale)[^]{0,40}\d{1,2}\s*[:h]\s*\d{2}/i;
  const timerRegex = /\b\d{1,2}\s*[:h]\s*\d{2}\b/;

  const urgencyCandidates = doc.querySelectorAll(
    "div, section, p, span, header, aside, .urgency-banner, [class*='banner'], [class*='countdown'], [class*='timer']",
  );

  for (const el of Array.from(urgencyCandidates)) {
    if (isProtectedElement(el)) continue;
    const text = el.textContent?.trim() || "";
    if (text.length > 300) continue;

    if (urgencyRegex.test(text) || (timerRegex.test(text) && /\b(sale|ends|hurry|today|deal|offer|flash)\b/i.test(text))) {
      // Find smallest container holding timer + label: walk up while parent text is < 120 chars
      let target: Element = el;
      while (
        target.parentElement &&
        target.parentElement !== doc.body &&
        target.parentElement.tagName.toLowerCase() !== "main" &&
        !isProtectedElement(target.parentElement) &&
        (target.parentElement.textContent?.trim().length || 0) < 120
      ) {
        target = target.parentElement;
      }

      const sel = uniqueSelector(target, doc);
      if (sel) {
        addRule({
          pattern: "fake_urgency",
          selector: sel,
          action: "remove",
          reason: "Timer restarts on reload",
          confidence: 0.9,
        });
      }
    }
  }

  // 2. FALSE SCARCITY
  // /only\s+\d+\s+(left|remaining|in stock)/i or /(selling fast|almost gone|low stock|high demand|last chance|\d+\s+(rooms?|seats?|tickets?)\s+left)/i
  const scarcityRegex = /(only\s+\d+\s+(left|remaining|in stock)|selling fast|almost gone|low stock|high demand|last chance|\b\d+\s+(rooms?|seats?|tickets?)\s+left)/i;
  const scarcityCandidates = doc.querySelectorAll("p, span, div, strong, em, [class*='stock'], [class*='scarcity']");

  for (const el of Array.from(scarcityCandidates)) {
    if (isProtectedElement(el)) continue;
    const text = el.textContent?.trim() || "";
    if (text.length > 120) continue;

    if (scarcityRegex.test(text)) {
      const sel = uniqueSelector(el, doc);
      if (sel) {
        addRule({
          pattern: "false_scarcity",
          selector: sel,
          action: "remove",
          reason: "Stock claim unverifiable",
          confidence: 0.85,
        });
      }
    }
  }

  // 3. FAKE SOCIAL PROOF
  // /\d+\s+(people|others|shoppers|travell?ers|users)\s+(are\s+)?(viewing|looking|watching)/i, /(just|recently)\s+(bought|booked|purchased)/i, /booked\s+\d+\s+times\s+(today|in the last)/i
  const socialProofRegex = /(\d+\s+(people|others|shoppers|travell?ers|users)\s+(are\s+)?(viewing|looking|watching)|(just|recently)\s+(bought|booked|purchased)|booked\s+\d+\s+times\s+(today|in the last))/i;
  const proofCandidates = doc.querySelectorAll("p, span, div, aside, [class*='viewer'], [class*='toast'], [class*='social-proof']");

  for (const el of Array.from(proofCandidates)) {
    if (isProtectedElement(el)) continue;
    const text = el.textContent?.trim() || "";
    if (text.length > 200) continue;

    if (socialProofRegex.test(text)) {
      // If it's inside a toast container, select the container
      let target: Element = el;
      const toastAncestor = el.closest(".toast-social-proof, [class*='toast'], [class*='popup'], [role='status']");
      if (toastAncestor && !isProtectedElement(toastAncestor)) {
        target = toastAncestor;
      }

      const sel = uniqueSelector(target, doc);
      if (sel) {
        addRule({
          pattern: "fake_social_proof",
          selector: sel,
          action: "remove",
          reason: "Unverifiable social proof",
          confidence: 0.85,
        });
      }
    }
  }

  // 4. SNEAK INTO BASKET (Pre-ticked add-ons)
  // input[type=checkbox]:checked whose label/nearby text matches /(protect|warranty|insurance|cover|care|donat|tip|upgrade|priority|subscribe|newsletter|add\b)/i
  const sneakRegex = /(protect|warranty|insurance|cover|care|donat|tip|upgrade|priority|subscribe|newsletter|\badd\b)/i;
  const checkboxes = doc.querySelectorAll('input[type="checkbox"]:checked, [role="checkbox"][aria-checked="true"]');

  for (const cb of Array.from(checkboxes)) {
    const parent = cb.closest("label, .addon-card, [class*='addon'], [class*='warranty'], div") || cb.parentElement;
    const nearbyText = (parent ? parent.textContent : cb.textContent) || "";

    if (sneakRegex.test(nearbyText)) {
      const sel = uniqueSelector(cb, doc);
      addRule({
        pattern: "sneak_into_basket",
        selector: sel,
        action: "uncheck",
        reason: "Pre-ticked add-on unticked",
        confidence: 0.9,
      });
    }
  }

  // 5. CONFIRMSHAMING
  // button/link text /^no,?\s*(thanks|thank you)?,?\s*i\s*('d| would)?\s*(rather|prefer|don'?t|do not|hate|like)/i or /i don'?t (want|like) (to save|deals|discounts)/i
  const shameRegex = /(^no,?\s*(thanks|thank you)?,?\s*i\s*('d| would)?\s*(rather|prefer|don'?t|do not|hate|like)|i don'?t (want|like) (to save|deals|discounts))/i;
  const shameCandidates = doc.querySelectorAll("button, a, span, p");

  for (const el of Array.from(shameCandidates)) {
    const text = el.textContent?.trim() || "";
    if (shameRegex.test(text)) {
      const sel = uniqueSelector(el, doc);
      if (sel) {
        addRule({
          pattern: "confirmshaming",
          selector: sel,
          action: "rewrite_text",
          text: "No thanks",
          reason: "Confirmshaming link rewritten",
          confidence: 0.9,
        });
      }
    }
  }

  // 6. NAGGING POPUP
  // element with position: fixed, z-index >= 1000, covering >= 30% of viewport, containing email input or /(\d+%\s*off|sign up|subscribe|newsletter|spin|unlock)/i
  const overlayRegex = /(\d+%\s*off|sign up|subscribe|newsletter|spin|unlock|get \$\d+ off)/i;
  const modals = doc.querySelectorAll(
    "[role='dialog'], .modal-overlay, .modal, [class*='modal'], [class*='overlay'], [class*='popup'], [id*='modal'], [id*='popup']",
  );

  for (const el of Array.from(modals)) {
    if (isProtectedElement(el)) continue;

    let isFixed = false;
    let highZIndex = false;
    let coversViewport = false;

    try {
      const style = window.getComputedStyle(el);
      isFixed = style.position === "fixed" || style.position === "absolute";
      const z = parseInt(style.zIndex, 10);
      highZIndex = !isNaN(z) && z >= 90;

      const rect = el.getBoundingClientRect();
      const viewportArea = (window.innerWidth || 1000) * (window.innerHeight || 800);
      const elArea = rect.width * rect.height;
      coversViewport = elArea >= 0.25 * viewportArea;
    } catch {
      // fallback based on classes/structure
      isFixed = el.classList.contains("modal-overlay") || Boolean(el.id && el.id.includes("modal"));
      highZIndex = true;
      coversViewport = true;
    }

    const hasEmail = !!el.querySelector('input[type="email"], input[placeholder*="email" i]');
    const matchesText = overlayRegex.test(el.textContent || "");

    if ((isFixed || highZIndex || coversViewport) && (hasEmail || matchesText)) {
      const sel = uniqueSelector(el, doc);
      if (sel) {
        addRule({
          pattern: "nagging_popup",
          selector: sel,
          action: "dismiss",
          reason: "Entry popup dismissed",
          confidence: 0.95,
        });
      }
    }
  }

  // 7. DRIP PRICING
  // headline price present and page text has /(\+\s*)?(fees?|taxes|shipping)\s+(calculated|added|at checkout|extra|not included)/i
  const dripRegex = /(\+\s*)?(fees?|taxes|shipping)\s+(calculated|added|at checkout|extra|not included)/i;
  const pageText = doc.body?.textContent || "";

  if (dripRegex.test(pageText)) {
    // Find headline price element selector
    const headline = doc.querySelector("#headline-price, .current-price, [itemprop='price'], h1 ~ * .price");
    if (headline) {
      const sel = uniqueSelector(headline, doc);
      if (sel) {
        addRule({
          pattern: "drip_pricing",
          selector: sel,
          action: "annotate_total",
          reason: "Hidden fees and shipping surfaced",
          confidence: 0.8,
        });
      }
    }
  }

  // 8. BURIED SPECS
  // table/dl/list with >=4 key:value rows, hidden or inside collapsed [aria-expanded=false]/details:not([open])
  const buriedSections = doc.querySelectorAll(
    "details:not([open]), [aria-expanded='false'], .collapsed, [class*='accordion']",
  );

  for (const sec of Array.from(buriedSections)) {
    const table = sec.querySelector("table, dl");
    if (table) {
      const rows = table.querySelectorAll("tr, dl > dt, [role='row']");
      if (rows.length >= 4) {
        const sel = uniqueSelector(sec, doc);
        if (sel) {
          addRule({
            pattern: "buried_specs",
            selector: sel,
            action: "surface",
            reason: "Key specifications surfaced",
            confidence: 0.85,
            modes: ["analytical"],
          });
        }
      }
    }
  }

  // 9. CLUTTER (for Minimalist mode)
  const clutterCandidates = doc.querySelectorAll(
    "section, aside, div[class*='recommend'], div[class*='carousel'], div[class*='upsell']",
  );
  for (const sec of Array.from(clutterCandidates)) {
    const heading = sec.querySelector("h2, h3, h4, .title");
    const headingText = heading?.textContent || "";
    if (/(you may also like|recommended|customers also|sponsored|frequently bought together)/i.test(headingText)) {
      const sel = uniqueSelector(sec, doc);
      if (sel) {
        addRule({
          pattern: "clutter",
          selector: sel,
          action: "hide",
          reason: "Clutter removed for minimalist view",
          confidence: 0.8,
          modes: ["minimalist"],
        });
      }
    }
  }

  return rules;
}
