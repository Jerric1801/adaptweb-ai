# Demo video — script + shot list (~90 s)

Record on macOS with **Cmd+Shift+5 → Record Selected Portion** (or QuickTime → New Screen Recording, mic on for voiceover). 1280×720 window, browser zoom 110%, hide bookmarks bar, close other tabs, Do Not Disturb on.

## Prep (10 min, once)

1. Install the extension from the zip exactly as a viewer would (proves the instructions work):
   download `/adaptweb-extension.zip` → unzip → `chrome://extensions` → Developer mode → Load unpacked → pin it.
2. Serve the fixture store (the extension only runs on http/https, not file://):
   `cd extension/fixtures && python3 -m http.server 8080` → open `http://localhost:8080/demo-store.html`.
3. Sign in to the web dashboard with the demo email (6-digit code). Leave the dashboard open in a **second window**, side by side with the store tab for the live-feed shot.
4. Dashboard `⋯` menu → **Load demo data** once so tiles aren't empty; or leave it empty for a stronger "ticks up live" moment (recommended — then do the take with a fresh account).
5. Dry run the whole flow once, then record.

## Script

| # | Time | On screen | Voiceover |
|---|---|---|---|
| 1 | 0:00–0:08 | Landing page hero ("The web, without the pressure.") | "Online shopping is full of pressure — fake countdowns, invented scarcity, fees that show up at the last step." |
| 2 | 0:08–0:20 | Demo store, extension **off** (toggle off in popup). Slowly circle: countdown, "Only 2 left!", pre-ticked protection plan, "No thanks, I hate saving money", pop-up | "Here's a typical product page. A timer that resets, a stock claim, an add-on already ticked for me, and a button that shames me for declining." |
| 3 | 0:20–0:40 | Toggle **on**. Elements disappear/ghost; popup badge count appears; open popup list of changes; click one → page scrolls and flashes it | "AdaptWeb reads the page locally and removes the pressure. Every change is listed — click one and it shows exactly what was changed and why." |
| 4 | 0:40–0:52 | True Total card next to the price; popup shows Item + shipping + fees breakdown | "It also surfaces the true cost — fees added up, estimates clearly labelled — so the headline price isn't the only number I see." |
| 5 | 0:52–1:05 | Popup → switch Analytical → Minimalist → Visual; page re-lays each time | "And it reshapes the page for how I read: analytical, minimalist, or visual." |
| 6 | 1:05–1:12 | Click **Show original** → patterns return → **Re-apply** | "Everything is reversible. I'm always in control." |
| 7 | 1:12–1:30 | Switch to dashboard window. Reload store page; new rows slide into the live feed, tiles tick up, "Live" dot pulsing. End on tiles + per-site table. | "Every page is logged to my private dashboard — what was removed, which sites, and the hidden costs surfaced — updating live. The web, without the pressure." |

Closing card (optional, 3 s): logo + site URL + "Download for Chrome".

## Cut-downs

- **30 s version:** shots 2 → 3 → 4 → 7 (skip modes/undo).
- **Silent version for the landing page:** same shots, burn in captions from the voiceover column.

## Tips

- Narrate slower than feels natural; leave a half-second hold after each change.
- If the live feed doesn't tick: confirm the extension is signed in (popup) and `adaptation_events` is in the realtime publication (migration 0002).
- Use only the fixture store or sites you have the rights to show. Never show real logins, emails of others, or payment details.
- Export 1080p H.264; trim dead air with QuickTime (Edit → Trim).
