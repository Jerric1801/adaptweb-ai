/**
 * Rule applier and undo manager.
 * Idempotent, safe, and handles ghosts and DOM modifications.
 */
import {
  type AppliedChange,
  PATTERN_LABELS,
  type PatternType,
  type Rule,
  type RuleSource,
  type Settings,
} from "../shared/contracts";
import { parsePrice } from "./price";
import { renderTrueTotalCard } from "./truetotal";

type UndoClosure = () => void;
const undoStack: UndoClosure[] = [];
let changeCounter = 0;

function isProtectedTarget(el: Element, doc: Document): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "html" || tag === "body" || tag === "main" || tag === "h1") return true;
  if (el.querySelector("h1")) return true;

  // Never hide product title or primary add-to-cart button
  if (tag === "button" || tag === "a" || el.getAttribute("role") === "button") {
    const text = el.textContent || "";
    if (/\b(add to cart|add to bag|buy now)\b/i.test(text)) {
      if (!el.closest("[role='dialog'], .modal, .modal-overlay, [class*='modal']")) {
        return true;
      }
    }
  }

  // Never hide primary price display
  if (el.id === "headline-price" || el.getAttribute("itemprop") === "price") {
    return true;
  }

  return false;
}

export function undoAll(doc: Document = document): void {
  while (undoStack.length > 0) {
    const fn = undoStack.pop();
    try {
      fn?.();
    } catch (err) {
      console.warn("[AdaptWeb] Error during undo:", err);
    }
  }

  // Clean up any remaining ghosts or injected UI
  doc.querySelectorAll(".aw-ghost, .aw-uncheck-note").forEach((el) => el.remove());
  doc.querySelectorAll(".aw-hidden").forEach((el) => el.classList.remove("aw-hidden"));
  doc.querySelectorAll("[data-aw-id]").forEach((el) => el.removeAttribute("data-aw-id"));

  renderTrueTotalCard(doc, null);

  const panel = doc.querySelector("adaptweb-mode-panel");
  panel?.remove();
}

export function apply(
  rules: Rule[],
  settings: Settings,
  source: RuleSource,
  doc: Document = document,
): AppliedChange[] {
  const applied: AppliedChange[] = [];

  for (const rule of rules) {
    // Check mode filtering
    if (rule.modes && rule.modes.length > 0 && !rule.modes.includes(settings.mode)) {
      continue;
    }

    // Skip stripping if dark patterns stripping is disabled, except for annotate_total
    if (!settings.stripDarkPatterns && rule.action !== "annotate_total") {
      continue;
    }

    // Skip annotate_total if true total is disabled
    if (!settings.showTrueTotal && rule.action === "annotate_total") {
      continue;
    }

    let elements: NodeListOf<Element>;
    try {
      elements = doc.querySelectorAll(rule.selector);
    } catch {
      continue; // invalid selector
    }

    let count = 0;
    for (const el of Array.from(elements)) {
      if (count >= 20) break; // Cap 20 elements per rule

      // Blocklist check
      if (isProtectedTarget(el, doc) && rule.action !== "annotate_total") {
        continue;
      }

      // Idempotency: skip if already tagged
      if (el.hasAttribute("data-aw-id")) {
        continue;
      }

      changeCounter++;
      const changeId = `${rule.pattern}:${rule.selector}:${changeCounter}`;
      el.setAttribute("data-aw-id", changeId);

      let value_cents: number | undefined;

      switch (rule.action) {
        case "remove": {
          el.classList.add("aw-hidden");
          let ghostEl: HTMLElement | null = null;

          if (settings.showGhosts && el.parentElement) {
            ghostEl = doc.createElement("div");
            ghostEl.className = "aw-ghost";
            const label = PATTERN_LABELS[rule.pattern] || rule.pattern;
            ghostEl.textContent = `✓ ${label} removed · ${rule.reason || "Neutralized"}`;

            // Peek toggle
            ghostEl.addEventListener("click", () => {
              el.classList.toggle("aw-hidden");
            });

            el.parentElement.insertBefore(ghostEl, el);
          }

          undoStack.push(() => {
            el.classList.remove("aw-hidden");
            ghostEl?.remove();
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "hide": {
          el.classList.add("aw-hidden");
          undoStack.push(() => {
            el.classList.remove("aw-hidden");
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "uncheck": {
          const input = el as HTMLInputElement;
          const wasChecked = input.checked || input.getAttribute("aria-checked") === "true";

          // Calculate value_cents if price in text
          const parentText = input.closest("label, div")?.textContent || "";
          const parsed = parsePrice(parentText);
          if (parsed) {
            value_cents = Math.round(parsed.value * 100);
          }

          if (wasChecked) {
            // Trigger click for React/Vue listeners
            input.click();
            if (input.checked) {
              input.checked = false;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            if (input.getAttribute("aria-checked") === "true") {
              input.setAttribute("aria-checked", "false");
            }
          }

          // Add annotation note
          const note = doc.createElement("span");
          note.className = "aw-uncheck-note";
          note.style.cssText =
            "display: block; font-size: 10px; font-weight: 600; font-family: ui-monospace, monospace; color: #2d6a4f; margin-top: 3px;";
          note.textContent = "✓ Was pre-ticked — unticked for you";

          const container = input.closest("label") || input.parentElement;
          container?.appendChild(note);

          undoStack.push(() => {
            note.remove();
            if (wasChecked) {
              input.click();
              input.checked = true;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "rewrite_text": {
          const originalText = el.textContent || "";
          const newText = rule.text || "No thanks";

          // Find deepest text node or replace element textContent
          el.textContent = newText;

          undoStack.push(() => {
            el.textContent = originalText;
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "dismiss": {
          const originalDisplay = (el as HTMLElement).style.display;
          (el as HTMLElement).style.display = "none";

          // Also check for backdrop siblings
          const backdrop = doc.querySelector(".modal-backdrop, .overlay, [class*='backdrop']");
          const originalBackdropDisplay = backdrop ? (backdrop as HTMLElement).style.display : "";
          if (backdrop) {
            (backdrop as HTMLElement).style.display = "none";
          }

          // Restore body overflow
          const originalOverflow = doc.body.style.overflow;
          const originalHtmlOverflow = doc.documentElement.style.overflow;
          doc.body.style.overflow = "auto";
          doc.documentElement.style.overflow = "auto";

          // Try clicking close button inside
          const closeBtn = el.querySelector(
            "button[aria-label*='close' i], .close, .modal-close, button:has(svg)",
          ) as HTMLButtonElement | null;
          try {
            closeBtn?.click();
          } catch {
            // ignore
          }

          undoStack.push(() => {
            (el as HTMLElement).style.display = originalDisplay;
            if (backdrop) (backdrop as HTMLElement).style.display = originalBackdropDisplay;
            doc.body.style.overflow = originalOverflow;
            doc.documentElement.style.overflow = originalHtmlOverflow;
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "surface": {
          // Open details or expand section
          let wasOpen = false;
          if (el.tagName.toLowerCase() === "details") {
            const det = el as HTMLDetailsElement;
            wasOpen = det.open;
            det.open = true;
          } else if (el.getAttribute("aria-expanded") === "false") {
            el.setAttribute("aria-expanded", "true");
          }

          undoStack.push(() => {
            if (el.tagName.toLowerCase() === "details") {
              (el as HTMLDetailsElement).open = wasOpen;
            } else {
              el.setAttribute("aria-expanded", "false");
            }
            el.removeAttribute("data-aw-id");
          });
          break;
        }

        case "annotate_total": {
          // delegate to true-total card rendering
          undoStack.push(() => {
            el.removeAttribute("data-aw-id");
          });
          break;
        }
      }

      applied.push({
        id: `${rule.pattern}:${rule.selector}`,
        pattern: rule.pattern,
        action: rule.action,
        selector: rule.selector,
        reason: rule.reason || "Neutralized by AdaptWeb",
        source,
        value_cents,
        ts: Date.now(),
      });

      count++;
    }
  }

  return applied;
}
