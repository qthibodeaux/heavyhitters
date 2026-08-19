# Heavy Hitters Promotions — Agent Handoff

Static boxing-promotion website template. Client: Heavy Hitters Promotions LLC. This doc describes what actually exists in the repo today, so you don't assume more (or less) is implemented than is. Last updated after Decap CMS was wired in — if you're reading this much later, verify against the actual files before trusting anything below.

## Repo / deploy state

- GitHub: `https://github.com/qthibodeaux/heavyhitters` (branch `main`)
- Currently deployed via **GitHub Pages** at `https://qthibodeaux.github.io/heavyhitters/` — quick preview link for showing the customer, not the production home, and **the CMS admin panel will not work there** (see below).
- **Production will be Netlify** (not set up yet). Netlify Identity + Git Gateway is what the `/admin` panel needs to authenticate — no GitHub OAuth app, no proxy server, but it only works once the site is actually deployed on Netlify with Identity enabled and the client invited as a user.

## File structure

```
index.html
css/styles.css
css/themes.css
js/main.js
js/customizer.js
content/settings.json      — hero copy/image + contact info (singleton)
content/fights.json        — all fights: upcoming schedule AND past results in one list
content/fighters.json      — fighter roster
content/news.json          — news posts
admin/index.html           — Decap CMS bootstrap (loads decap-cms.js from unpkg)
admin/config.yml           — Decap collection/field definitions
img/hero-ring.png          — hero background photo
```

No build step, no framework, no package.json. Plain HTML/CSS/JS, content fetched client-side as JSON at page load. (`.agents/skills/` and `skills-lock.json` are Emil Kowalski's motion-design skill pack, installed for a later animation pass — ignore for CMS purposes.)

## How content rendering works (important — read before touching sections)

`index.html` for the Schedule, Past Results, Roster, News, hero text, and contact-info sections contains **empty container elements only** (`#fightList`, `#resultsGrid`, `#rosterList`, `#newsList`, `#heroTitle`, etc.) — there is no hardcoded fighter/fight/news markup left in the HTML. `js/main.js` fetches all four `content/*.json` files on load, renders HTML strings into those containers (see the `render*` functions), and only then wires up scroll-reveal, the countdown timer, and the past-results modal — because none of those elements exist until after render.

**This means:** you cannot preview the page by opening `index.html` directly (`file://`) — `fetch()` is blocked by CORS on the file protocol. Always serve it locally, e.g. `python -m http.server 8123`, then open `http://localhost:8123`.

**If you add a new content field:** update three places — the `content/*.json` shape, the matching `admin/config.yml` field definition, and the render function in `js/main.js` that consumes it.

## Decap CMS — built, not yet testable end-to-end

The admin panel, config, and content files all exist and the site correctly renders from them. What's **not** verifiable yet: actually logging into `/admin` and saving a change, because that requires Netlify Identity + Git Gateway, which requires the site to be deployed on Netlify first. Until then, content changes have to be made by hand-editing the `content/*.json` files (which is exactly what the client will stop needing to do once Netlify Identity is live).

### Collections (in `admin/config.yml`)

**Fights** (`content/fights.json`) — **one collection covers both upcoming schedule and past results**, distinguished by a `status` field (`upcoming` / `completed`). This was a deliberate simplification from an earlier plan that had two separate collections — a fight is one entity that transitions status, not two content types. The **soonest upcoming fight automatically gets the countdown timer** (picked by earliest `date` in `js/main.js`, not a field the client sets). Fields: `status`, `title`, `date`, `dateLabel`, `badge`/`venue`/`weightClass`/`ticketLink`/`fighterA`/`fighterB` (upcoming only), `result`/`recap` (completed only). Each fighter object has an optional `photo` — if blank, the site shows the placeholder silhouette automatically (see below).

**Fighters** (`content/fighters.json`) — roster list. Fields: `name`, `division` (select), `wins`/`losses`/`draws`/`kos` (numbers, shown as the W-L-D-KO stat row), `photo` (optional), `bio`.

**News** (`content/news.json`) — fields: `date`, `dateLabel`, `tag`, `title`, `excerpt`, `link`.

**Site Settings** (`content/settings.json`) — a `files` collection (singleton, not a list) for hero eyebrow/title/subhead/background image and phone/email/office.

All three real collections use Decap's **List widget**, which is what gives the client native "Add" and per-item delete buttons — that's the actual add/remove mechanism, no custom UI needed.

### Placeholder photos

Every fighter/fighterA/fighterB has an optional `photo` field. `js/main.js`'s `photoOrSilhouette()` helper renders the uploaded image if present, otherwise falls back to a shared inline SVG boxer-silhouette icon (`SILHOUETTE_SVG` constant near the top of the file). **Do not replace the silhouette with real boxer photos yourself** — leave `photo` blank for placeholder fighters; the client fills it in via Decap once they have real photography. Don't use real boxers' names either — everyone in the current content files is invented.

## Design system

- Color/type system follows a "High-Contrast / Modern Brutalism" spec from an earlier design pass: sharp 0-radius corners, black/white/red palette, border-based depth (no shadows) — applied to the newer components (fight cards, roster rows, news rows, status chips, silhouette boxes). Older components (buttons, modal, contact form) still use rounded corners — that's a known, deliberate gap, not an oversight.
- `<body data-theme="..." data-font="...">` still drives a 5-color-theme / 7-font-pairing demo system in `css/themes.css`, toggled via the floating "Customize" panel (`js/customizer.js`). **This panel is dev-only — remove it before final client launch.**
- Default font pairing: `bigshoulders-worksans` (Big Shoulders Display / Work Sans) — chosen deliberately over the cliché "AI sports template" fonts (Anton, Bebas Neue, Oswald, Teko, Rajdhani), which are still available as customizer options but no longer default.
- A subtle full-page film-grain texture overlay lives in `css/styles.css` as `body::before` (inline SVG noise, plain opacity — not `mix-blend-mode`, which didn't composite reliably on the fixed pseudo-element when tested).

## Motion state

- Existing: scroll-triggered `.reveal` fade/slide-up (re-bound after each content render), hover states, modal scale transition, countdown ticker.
- An animation-opportunities audit was done early on (via the `find-animation-opportunities` skill methodology) but **not implemented** — hero entrance sequencing, countdown digit-crossfade, card hover curve/gating fixes, etc. **Motion polish is still explicitly deferred** — don't do animation work unless specifically asked.

## Suggested next steps

1. Get the site onto Netlify, enable Identity + Git Gateway, invite the client, confirm `/admin` login and a real save round-trip
2. Decide whether to bring the older components (buttons, modal, contact form) in line with the sharp-corner design system
3. Motion/animation pass, when asked for
