/**
 * True Total calculation and Shadow DOM card injection.
 */
import type { Rule, TrueTotal, TrueTotalPart } from "../shared/contracts";
import { findHeadlinePrice, parsePrice } from "./price";

export function computeTrueTotal(doc: Document, rules: Rule[]): TrueTotal | null {
  const headline = findHeadlinePrice(doc);
  if (!headline || headline.value <= 0) return null;

  const currency = headline.currency || "USD";
  const parts: TrueTotalPart[] = [
    { label: "Item", value: headline.value, origin: "page" },
  ];

  // 1. Shipping
  let shippingVal: number | null = null;
  let shippingOrigin: "rule" | "page" = "page";
  let shippingLabel = "Shipping";

  // Check rule extras
  for (const r of rules) {
    if (r.pattern === "drip_pricing" && r.extras?.shipping_value !== undefined) {
      shippingVal = r.extras.shipping_value;
      shippingOrigin = "rule";
      break;
    }
  }

  // Check JSON-LD shipping details
  if (shippingVal === null) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const checkObj = (obj: any): number | null => {
          if (!obj) return null;
          const rate =
            obj.shippingDetails?.shippingRate?.value ??
            obj.offers?.shippingDetails?.shippingRate?.value ??
            (Array.isArray(obj.offers) ? obj.offers[0]?.shippingDetails?.shippingRate?.value : undefined);
          if (rate !== undefined) {
            const v = parseFloat(String(rate));
            if (!isNaN(v)) return v;
          }
          return null;
        };

        const res = Array.isArray(data) ? checkObj(data[0]) : checkObj(data);
        if (res !== null) {
          shippingVal = res;
          shippingOrigin = "page";
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  // Check page text for shipping
  if (shippingVal === null) {
    const pageText = doc.body?.textContent || "";
    // Check for "free shipping over $X"
    const freeOverMatch = pageText.match(/free\s+shipping\s+over\s+[$£€]?\s*(\d+)/i);
    if (freeOverMatch) {
      const threshold = parseFloat(freeOverMatch[1]);
      if (headline.value >= threshold) {
        shippingVal = 0;
        shippingLabel = `Free shipping (over $${threshold})`;
      }
    }

    if (shippingVal === null) {
      const shippingMatch = pageText.match(/(?:shipping|delivery)[^$£€\d]{0,30}([$£€]\s?\d[\d.,]*)/i);
      if (shippingMatch) {
        const parsed = parsePrice(shippingMatch[1]);
        if (parsed && parsed.value > 0) {
          shippingVal = parsed.value;
          shippingOrigin = "page";
        }
      }
    }
  }

  if (shippingVal !== null && shippingVal > 0) {
    parts.push({
      label: shippingLabel,
      value: shippingVal,
      origin: shippingOrigin,
    });
  }

  // 2. Fees
  let feeValues: { label: string; value: number }[] = [];
  for (const r of rules) {
    if (r.extras?.fee_values && r.extras.fee_values.length > 0) {
      feeValues = r.extras.fee_values;
      break;
    }
  }

  if (feeValues.length > 0) {
    for (const f of feeValues) {
      parts.push({
        label: f.label || "Fee",
        value: f.value,
        origin: "rule",
      });
    }
  } else {
    // Scan page text for fees
    const pageText = doc.body?.textContent || "";
    const feeMatch = pageText.match(/(?:estimated\s+)?(service|booking|processing|convenience|facility|handling)\s+fee[^$£€\d]{0,20}([$£€]\s?\d[\d.,]*)/i);
    if (feeMatch) {
      const parsed = parsePrice(feeMatch[2]);
      if (parsed && parsed.value > 0) {
        const name = feeMatch[1].charAt(0).toUpperCase() + feeMatch[1].slice(1).toLowerCase() + " fee";
        parts.push({
          label: name,
          value: parsed.value,
          origin: "page",
        });
      }
    }
  }

  // 3. Tax
  let taxRate: number | null = null;
  for (const r of rules) {
    if (r.extras?.tax_rate !== undefined) {
      taxRate = r.extras.tax_rate;
      break;
    }
  }

  if (taxRate !== null && taxRate > 0) {
    const estTax = Math.round(headline.value * taxRate * 100) / 100;
    parts.push({
      label: `Est. tax (${Math.round(taxRate * 100)}%)`,
      value: estTax,
      origin: "estimate",
    });
  }

  // Hard rule: IF NO EXTRA PARTS, RETURN NULL
  if (parts.length <= 1) {
    return null;
  }

  const total = Math.round(parts.reduce((sum, p) => sum + p.value, 0) * 100) / 100;
  const hiddenDelta = Math.round((total - headline.value) * 100) / 100;

  return {
    currency,
    parts,
    total,
    shownPrice: headline.value,
    hiddenDelta,
  };
}

/**
 * Injects or updates the True Total card in Shadow DOM.
 */
export function renderTrueTotalCard(doc: Document, trueTotal: TrueTotal | null): void {
  // Remove existing host if present
  const existing = doc.querySelector("adaptweb-true-total");
  if (!trueTotal) {
    existing?.remove();
    return;
  }

  // Find insertion point: right after headline price container
  const priceEl =
    doc.querySelector("#headline-price")?.closest(".price-container, .price-row, .price") ||
    doc.querySelector(".price, [itemprop='price'], #headline-price");

  if (!priceEl || !priceEl.parentElement) {
    return;
  }

  const host = existing || doc.createElement("adaptweb-true-total");
  if (!existing) {
    priceEl.parentElement.insertBefore(host, priceEl.nextSibling);
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

  const money = (n: number) => {
    const sym = trueTotal.currency === "GBP" ? "£" : trueTotal.currency === "EUR" ? "€" : "$";
    return `${sym}${n.toFixed(2)}`;
  };

  shadow.innerHTML = `
    <style>
      :host {
        display: block;
        margin: 14px 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .card {
        background: #fbf8f1;
        border: 2px solid #1a1a1a;
        border-radius: 16px;
        padding: 16px;
        color: #1a1a1a;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .label {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #2d6a4f;
      }
      .total-amount {
        font-size: 28px;
        font-weight: 700;
        color: #111;
        letter-spacing: -0.02em;
      }
      .parts-list {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(26, 26, 26, 0.12);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .part-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #555;
      }
      .part-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .origin-badge {
        font-size: 9px;
        font-family: ui-monospace, monospace;
        padding: 1px 4px;
        border-radius: 4px;
        text-transform: uppercase;
        background: rgba(0,0,0,0.06);
        color: #444;
      }
      .part-val {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-weight: 600;
        color: #1a1a1a;
      }
      .delta-note {
        margin-top: 8px;
        font-size: 11px;
        color: #7f1d1d;
        background: #fef2f2;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 500;
      }
    </style>
    <div class="card">
      <div class="header">
        <span class="label">True Total</span>
        <span class="total-amount">${money(trueTotal.total)}</span>
      </div>
      <div class="parts-list">
        ${trueTotal.parts
          .map(
            (p) => `
          <div class="part-row">
            <span class="part-label">
              ${p.label}
              <span class="origin-badge">${p.origin}</span>
            </span>
            <span class="part-val">${money(p.value)}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      ${
        trueTotal.hiddenDelta > 0
          ? `<div class="delta-note">+${money(trueTotal.hiddenDelta)} in extra fees / shipping surfaced</div>`
          : ""
      }
    </div>
  `;
}
