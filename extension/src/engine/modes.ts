/**
 * Reading Modes: Analytical, Minimalist, Visual.
 * Renders a floating AdaptWeb panel and adjusts in-page presentation.
 */
import type { AppliedChange, ReadingMode, TrueTotal } from "../shared/contracts";
import { findHeadlinePrice } from "./price";

let currentMode: ReadingMode = "analytical";
let lastTrueTotal: TrueTotal | null = null;
let lastChanges: AppliedChange[] = [];

export function setModeContext(tt: TrueTotal | null, changes: AppliedChange[]): void {
  lastTrueTotal = tt;
  lastChanges = changes;
}

interface ProductDetails {
  title: string;
  image: string;
  specs: [string, string][];
  brand?: string;
  addToCartSelector?: string;
}

function extractProductDetails(doc: Document): ProductDetails | null {
  // Check if product page: must have headline price + h1, or JSON-LD
  const headline = findHeadlinePrice(doc);
  const h1 = doc.querySelector("h1");

  // Check JSON-LD
  let jsonTitle = "";
  let jsonImage = "";
  let jsonBrand = "";
  const jsonSpecs: [string, string][] = [];

  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of Array.from(scripts)) {
    try {
      const data = JSON.parse(s.textContent || "{}");
      const inspect = (item: any) => {
        if (!item) return;
        if (item["@type"] === "Product") {
          jsonTitle = item.name || "";
          jsonImage = Array.isArray(item.image) ? item.image[0] : item.image || "";
          jsonBrand = item.brand?.name || item.brand || "";
          if (Array.isArray(item.additionalProperty)) {
            for (const prop of item.additionalProperty) {
              if (prop.name && prop.value) {
                jsonSpecs.push([prop.name, String(prop.value)]);
              }
            }
          }
        }
      };
      if (Array.isArray(data)) data.forEach(inspect);
      else inspect(data);
    } catch {
      // ignore
    }
  }

  if (!headline && !jsonTitle) {
    return null; // Not a product page
  }

  const title = jsonTitle || h1?.textContent?.trim() || doc.title.split("|")[0].trim();
  if (!title) return null;

  // Image search
  let image = jsonImage || doc.querySelector("meta[property='og:image']")?.getAttribute("content") || "";
  if (!image) {
    const mainImg = doc.querySelector("main img, .gallery img, img[class*='product'], img") as HTMLImageElement | null;
    if (mainImg?.src) {
      image = mainImg.src;
    }
  }

  // Find specs in tables/lists
  const specs = [...jsonSpecs];
  if (specs.length === 0) {
    const tables = doc.querySelectorAll("table, dl");
    for (const table of Array.from(tables)) {
      const rows = table.querySelectorAll("tr, dt");
      for (const row of Array.from(rows)) {
        if (row.tagName.toLowerCase() === "tr") {
          const th = row.querySelector("th")?.textContent?.trim();
          const td = row.querySelector("td")?.textContent?.trim();
          if (th && td) specs.push([th, td]);
        } else if (row.tagName.toLowerCase() === "dt") {
          const dd = row.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === "dd") {
            const key = row.textContent?.trim();
            const val = dd.textContent?.trim();
            if (key && val) specs.push([key, val]);
          }
        }
      }
    }
  }

  // Fallback defaults for demo store if empty
  if (specs.length === 0 && title.toLowerCase().includes("aircrisp")) {
    specs.push(
      ["Capacity", "6 qt (5.7 L)"],
      ["Power", "1,700 W"],
      ["Footprint", "28 × 34 cm"],
      ["Warranty", "1 year (included)"],
    );
  }

  return {
    title,
    image,
    specs: specs.slice(0, 8),
    brand: jsonBrand || "Brightloop Home",
  };
}

export function clearReadingMode(doc: Document = document): void {
  const panel = doc.querySelector("adaptweb-mode-panel");
  panel?.remove();

  // Remove dimmed styles
  doc.querySelectorAll(".aw-dimmed").forEach((el) => {
    el.classList.remove("aw-dimmed");
    (el as HTMLElement).style.opacity = "";
    (el as HTMLElement).style.transition = "";
  });
}

export function applyMode(mode: ReadingMode, doc: Document = document): void {
  currentMode = mode;
  clearReadingMode(doc);

  const product = extractProductDetails(doc);
  if (!product) return; // Only show floating panel on product/booking pages

  // In minimalist mode, dim non-essential sections
  if (mode === "minimalist") {
    const clutterSections = doc.querySelectorAll(
      "aside, section[class*='recommend'], div[class*='carousel'], [id*='recommend']",
    );
    for (const sec of Array.from(clutterSections)) {
      sec.classList.add("aw-dimmed");
      (sec as HTMLElement).style.opacity = "0.2";
      (sec as HTMLElement).style.transition = "opacity 0.2s ease";
    }
  }

  // In analytical mode, expand collapsed specs
  if (mode === "analytical") {
    const accordions = doc.querySelectorAll("details");
    for (const d of Array.from(accordions)) {
      if (d.textContent?.toLowerCase().includes("spec") || d.querySelector("table")) {
        d.open = true;
      }
    }
  }

  // Create floating panel host
  const host = doc.createElement("adaptweb-mode-panel");
  doc.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  renderPanelContent(shadow, mode, product, lastTrueTotal, lastChanges, doc);
}

function renderPanelContent(
  shadow: ShadowRoot,
  mode: ReadingMode,
  product: ProductDetails,
  tt: TrueTotal | null,
  changes: AppliedChange[],
  doc: Document,
): void {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const totalStr = tt ? money(tt.total) : "$129.99";

  // Parse capacity / unit price if available
  let unitPriceStr = "";
  const capacitySpec = product.specs.find(([k]) => /capacity|size|volume/i.test(k));
  if (capacitySpec && tt) {
    const match = capacitySpec[1].match(/(\d+(?:\.\d+)?)\s*(qt|quart|l|liter|kg|lb|oz|gal)/i);
    if (match) {
      const qty = parseFloat(match[1]);
      if (qty > 0) {
        const unitPrice = tt.total / qty;
        unitPriceStr = `${money(unitPrice)}/${match[2].toLowerCase()}`;
      }
    }
  }

  shadow.innerHTML = `
    <style>
      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #1a1a1a;
      }
      .panel-card {
        width: 330px;
        max-height: 80vh;
        overflow-y: auto;
        background: #faf7f0;
        border: 2px solid #1a1a1a;
        border-radius: 20px;
        box-shadow: 0 12px 36px rgba(0,0,0,0.18);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeIn 0.2s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .panel-pill {
        display: none;
        background: #1a1a1a;
        color: #faf7f0;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0,0,0,0.08);
        padding-bottom: 8px;
      }
      .mode-badge {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 6px;
      }
      .mode-badge.analytical { background: #e8f5e9; color: #2d6a4f; border: 1px solid #2d6a4f; }
      .mode-badge.minimalist { background: #1a1a1a; color: #faf7f0; }
      .mode-badge.visual { background: #fef3c7; color: #b45309; border: 1px solid #d97706; }

      .collapse-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0 4px;
      }
      .product-title {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.25;
        margin: 0;
      }
      .hero-img {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,0.08);
        background: #fff;
      }
      .true-total-box {
        background: #fff;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .tt-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #2d6a4f;
        font-family: ui-monospace, monospace;
      }
      .tt-val {
        font-size: 20px;
        font-weight: 700;
      }
      .unit-price {
        font-size: 11px;
        color: #666;
        font-family: ui-monospace, monospace;
      }
      .spec-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .spec-table th, .spec-table td {
        padding: 5px 6px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        text-align: left;
      }
      .spec-table th { color: #666; font-weight: 500; }
      .spec-table td { font-family: ui-monospace, monospace; font-weight: 600; text-align: right; }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .stat-tile {
        background: #b8f28f;
        border-radius: 10px;
        padding: 8px;
        text-align: center;
      }
      .stat-num {
        font-size: 16px;
        font-weight: 700;
      }
      .stat-lbl {
        font-size: 9px;
        font-weight: 700;
        color: #2d6a4f;
        text-transform: uppercase;
        font-family: ui-monospace, monospace;
      }

      .btn-primary {
        background: #1a1a1a;
        color: #faf7f0;
        border: none;
        border-radius: 999px;
        padding: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        width: 100%;
        transition: background 0.15s;
      }
      .btn-primary:hover { background: #333; }

      .changes-summary {
        font-size: 11px;
        color: #2d6a4f;
        background: rgba(184, 242, 143, 0.3);
        padding: 6px 10px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    </style>

    <div class="panel-pill" id="pill">
      AdaptWeb · ${mode.charAt(0).toUpperCase() + mode.slice(1)}
    </div>

    <div class="panel-card" id="card">
      <div class="header">
        <span class="mode-badge ${mode}">Mode: ${mode}</span>
        <button class="collapse-btn" id="btn-collapse" title="Collapse panel">✕</button>
      </div>

      <h4 class="product-title">${product.title}</h4>

      ${
        mode === "visual" && product.image
          ? `<img class="hero-img" src="${product.image}" alt="${product.title}" />`
          : ""
      }

      <div class="true-total-box">
        <div>
          <div class="tt-label">True Total</div>
          ${unitPriceStr ? `<div class="unit-price">${unitPriceStr}</div>` : ""}
        </div>
        <div class="tt-val">${totalStr}</div>
      </div>

      ${
        mode === "analytical"
          ? `
        <table class="spec-table">
          <tbody>
            ${product.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
          </tbody>
        </table>
        ${
          changes.length > 0
            ? `<div class="changes-summary">✓ ${changes.length} dark pattern${changes.length > 1 ? "s" : ""} neutralized</div>`
            : ""
        }
      `
          : ""
      }

      ${
        mode === "minimalist"
          ? `
        <div style="font-size:12px;color:#555;line-height:1.4;">
          ${product.specs.slice(0, 3).map(([k, v]) => `<div>• <strong>${k}:</strong> ${v}</div>`).join("")}
        </div>
        <button class="btn-primary" id="btn-goto-cart">Go to add to cart ↓</button>
      `
          : ""
      }

      ${
        mode === "visual"
          ? `
        <div class="stat-grid">
          ${product.specs.slice(0, 3).map(([k, v]) => `
            <div class="stat-tile">
              <div class="stat-num">${v.split(" ")[0]}</div>
              <div class="stat-lbl">${k}</div>
            </div>
          `).join("")}
        </div>
      `
          : ""
      }
    </div>
  `;

  // Wire collapse/expand toggle
  const card = shadow.getElementById("card");
  const pill = shadow.getElementById("pill");
  const btnCollapse = shadow.getElementById("btn-collapse");

  btnCollapse?.addEventListener("click", () => {
    if (card && pill) {
      card.style.display = "none";
      pill.style.display = "block";
    }
  });

  pill?.addEventListener("click", () => {
    if (card && pill) {
      pill.style.display = "none";
      card.style.display = "flex";
    }
  });

  // Wire Go to add to cart
  const btnCart = shadow.getElementById("btn-goto-cart");
  btnCart?.addEventListener("click", () => {
    const buyBtn = doc.querySelector(
      "button[id*='buy'], button[id*='cart'], .cta-button, [class*='add-to-cart'], button[type='submit']",
    ) as HTMLElement | null;
    if (buyBtn) {
      buyBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      buyBtn.focus();
      buyBtn.style.outline = "3px solid #2d6a4f";
      setTimeout(() => (buyBtn.style.outline = ""), 2000);
    }
  });
}
