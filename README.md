# Sheer Roots International — Shopify theme

A custom Shopify **Online Store 2.0** theme for Sheer Roots International and its
sub-brand Social India Craft.

Plain Liquid, CSS and vanilla JavaScript. No build step, no bundler, no
framework. What is in this repository is exactly what Shopify serves, which is
what makes the GitHub integration a one-way sync you can trust.

---

## Contents

1. [Requirements](#requirements)
2. [Local setup](#local-setup)
3. [Validation](#validation)
4. [Connecting the repository to Shopify](#connecting-the-repository-to-shopify)
5. [Git workflow](#git-workflow)
6. [What the merchant manages, and where](#what-the-merchant-manages-and-where)
7. [Setup checklist for a new store](#setup-checklist-for-a-new-store)
8. [Architecture](#architecture)
9. [Section reference](#section-reference)
10. [Accessibility and performance notes](#accessibility-and-performance-notes)

---

## Requirements

| Tool | Version | Why |
|---|---|---|
| [Node.js](https://nodejs.org) | 20 LTS or newer | Runs the Shopify CLI |
| [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) | 3.x | Dev server, Theme Check, push/pull |
| Git | any recent | Version control |
| Shopify store access | Staff account with **Themes** permission | Preview and publish |

The Shopify CLI is declared as a dev dependency, so you do not need a global
install:

```bash
npm install
```

---

## Local setup

Authenticate and start a development theme. The CLI opens a browser window to
log in the first time.

```bash
npm run dev
```

This is `shopify theme dev`. It asks which store to connect to, uploads the
theme to a temporary development theme, and gives you a local preview URL with
hot reload. It never touches your published theme.

To preview against a specific store without being prompted:

```bash
npx shopify theme dev --store your-store.myshopify.com
```

Upload as an unpublished theme so you can review it in the admin:

```bash
npm run push
```

---

## Validation

```bash
npm run check
```

Runs Theme Check against `.theme-check.yml` (the `theme-check:recommended`
rule set). It validates Liquid syntax, every `{% schema %}`, translation keys,
asset references and Online Store 2.0 conventions.

To apply the fixes Theme Check can make on its own:

```bash
npm run check:fix
```

Theme Check should be clean before anything is merged.

---

## Connecting the repository to Shopify

1. Push this repository to GitHub (already configured as
   `sheerrootsinternational-hash/shopifyV1`).
2. In Shopify admin go to **Online Store → Themes**.
3. Under **Theme library**, open the **Add theme** menu and choose
   **Connect from GitHub**.
4. Authorise the Shopify GitHub app for the account or organisation that owns
   the repository.
5. Select this repository and the branch you want the store to track —
   `main` for production.
6. Shopify adds the theme to the library. Preview it, then **Publish** when
   you are happy.

### How the sync behaves

The connection is **two-way**:

- Commits pushed to the connected branch are deployed to that theme
  automatically, usually within a minute.
- Edits made in the Shopify **Theme Editor** or **Code editor** are committed
  back to the same branch by Shopify.

Two consequences worth knowing:

- **Always `git pull` before you start work.** A merchant changing a heading in
  the Theme Editor produces a real commit on `main`.
- Theme Editor changes land in `templates/*.json`, `sections/*-group.json` and
  `config/settings_data.json`. Those files are content, not code — expect them
  to change without you.

Connect a **separate branch to a separate unpublished theme** if you want a
staging environment.

---

## Git workflow

```
main ─────────────────────────────► connected to the LIVE theme
  ▲
  └── feature/… ───────────────────► merged via pull request
```

- Do development work on a branch, never directly on `main`.
- Run `npm run check` before opening a pull request.
- Merge to `main` only when you intend the change to go live.
- `git pull` first, every time — Shopify may have committed merchant edits.

### Never commit

The `.gitignore` already covers these, but to be explicit: no `.env` files, no
Shopify access tokens or API keys, no `shopify.theme.toml` (it holds the store
identifier for your machine), no `.shopify/` directory, no `node_modules/`.

The theme contains no secrets by design. Everything it needs comes from Shopify
at render time.

---

## What the merchant manages, and where

Nothing that a store administrator would reasonably want to change is written
into Liquid. This is the map.

### Shopify admin → Online Store → Themes → Customize

| What | Where |
|---|---|
| Home page hero (desktop image, **separate mobile image**, heading, text, buttons, overlay, height, text position) | Home page → **Hero banner** |
| Social India Craft block (image, mobile image, logo, heading, tagline, text, button, image side) | Home page → **Image with text** |
| The five "You are choosing" values | Home page → **Multi-column** (one block per value) |
| Pull quote | Home page → **Rich text** |
| Product slider (collection, number of products, columns, autoplay on/off, speed, slider or grid) | Home page → **Featured collection** |
| Product video (video file or YouTube/Vimeo link, cover image, mobile cover, heading, button) | Home page → **Video banner** |
| "Join our socials" | Home page → **Social** |
| Running tagline bar (text, speed, scroll on/off, colours) | Header group → **Announcement bar** |
| Header (menu, search on/off, social icons on/off, sticky, account icon) | Header group → **Header** |
| Footer (logo, about text, tagline, menus, contact details, payment icons) | Footer group → **Footer** |
| Section order, visibility, duplication, removal | Drag and drop in the editor; the eye icon hides a section |

### Shopify admin → Online Store → Themes → Customize → Theme settings

| What | Where |
|---|---|
| Sheer Roots logo, desktop and mobile width, footer logo | **Branding** |
| Social India Craft logo | **Branding** |
| Favicon, default social sharing image | **Branding** |
| Heading and body fonts, sizes, uppercase, letter spacing | **Typography** |
| All colours — the Ivory, Sand and Ink schemes, accent, borders, buttons | **Colours** |
| Maximum content width, section spacing, corner radius | **Layout** |
| Product card shape, alignment, hover image, badges, add-to-cart button | **Product cards** |
| Instagram, Facebook, Etsy, Pinterest, YouTube, WhatsApp URLs | **Social media** |
| Address, phone, email used by the footer and contact page | **Contact details** |
| Scroll animations on/off | **Motion** |

Every section also has its own **Colour scheme** (Ivory / Sand / Ink) and its
own top and bottom padding, so the rhythm of a page is adjustable without code.

### Elsewhere in Shopify admin

| What | Where |
|---|---|
| Navigation links (header and footer) | **Content → Menus** |
| Page copy — About, Social India Craft, Contact, policies | **Content → Pages** |
| Blog posts | **Content → Blog posts** |
| Images and videos | **Content → Files** |
| Products, prices, images, variants, availability | **Products** |
| Collections used by the sliders | **Products → Collections** |
| Terms, Privacy, Refund, Shipping policies | **Settings → Policies** |
| Where contact form submissions arrive | **Settings → Store details → Sender email** |

### Metafields

**The theme requires no custom metafields.** Everything the design calls for is
covered by theme settings, section settings and Shopify's own product and
collection data — which is the simplest correct mechanism, and the one a
non-developer can manage.

Two section settings accept **dynamic sources** if you later want per-product or
per-page variation without duplicating sections:

- **Product information → Tagline** — connect to a product metafield so each
  product can carry its own strapline (for example *"Pair it. Gift it. Carry
  it."*).
- **Page content → Subheading** — connect to a page metafield.

To use them: create the definition under **Settings → Custom data**, then click
the dynamic-source icon next to the field in the Theme Editor and pick it.

---

## Setup checklist for a new store

The theme ships with the copy from the design document already filled in, so
most of this is uploading assets and pointing settings at real data.

1. **Create the pages** under *Content → Pages* and assign the matching theme
   template in the sidebar:

   | Page title | Handle | Template |
   |---|---|---|
   | About Us | `about` | `page.about` |
   | Social India Craft | `social-india-craft` | `page.social-india-craft` |
   | Contact Us | `contact` | `page.contact` |
   | Orders & Shipping | `orders-shipping` | `page.faq` |
   | Terms & Conditions | `terms-conditions` | `page` (default) |
   | Privacy Policy | `privacy-policy` | `page` (default) |
   | Exchange & Return Policy | `exchange-return` | `page` (default) |

   Body copy for the four policy pages is in [`docs/content/`](docs/content) —
   paste it into the page's rich-text editor. It lives there rather than in
   Liquid so the merchant owns it.

2. **Build the menus** under *Content → Menus*:
   - `main-menu`: Home, About Us, Social India Craft, Contact Us
   - `footer`: Terms & Conditions, Privacy Policy, Orders & Shipping,
     Exchange & Return

3. **Upload the logos** under *Theme settings → Branding* — the Sheer Roots
   logo and the Social India Craft logo.

4. **Add the social URLs** under *Theme settings → Social media*. Any field left
   empty hides that icon everywhere.

5. **Check the contact details** under *Theme settings → Contact details*.

6. **Create the collections** the sliders point at, then select them in the
   **Featured collection** sections on the home page and the Social India Craft
   page.

7. **Upload the banner images.** Every banner takes a desktop image and an
   optional mobile image — use the mobile slot wherever the desktop crop would
   cut off the subject on a phone.

8. **Upload the product video** under *Content → Files*, then select it in the
   **Video banner** section along with a cover image.

9. **Write the store policies** under *Settings → Policies* so the footer policy
   links appear.

---

## Architecture

```
GitHub  ──► theme code (Liquid, CSS, JS, sections, blocks)
              │
              ▼
Shopify  ──► content (settings, images, video, pages, products,
                      collections, menus, policies)
              │
              ▼
          Storefront
```

Code decides how the site looks and behaves. Shopify owns every piece of
content and data. The two do not overlap.

```
.
├── assets/          CSS and JS, one file per concern
├── blocks/          reusable theme blocks for the Flexible content section
├── config/          theme settings schema and saved values
├── docs/            page copy for the merchant to paste into Shopify
├── layout/          theme, password and gift-card layouts
├── locales/         all storefront strings
├── sections/        merchant-configurable modules + header/footer groups
├── snippets/        shared markup
└── templates/       JSON templates that compose sections per page
```

### Colour schemes

Rather than a colour picker on every section, the theme defines three schemes —
**Ivory**, **Sand** and **Ink** — in Theme settings. Each section picks one.

`snippets/theme-tokens.liquid` turns the settings into CSS custom properties,
and the `.scheme-*` classes re-point the same variables. Components only ever
reference `var(--bg)`, `var(--fg)`, `var(--accent)` and friends, so nothing is
duplicated per scheme and the whole palette can be changed in one place.

### CSS

`assets/base.css` (reset, type, layout, buttons, forms) and
`assets/components.css` (cards, media, accordions, pagination) load on every
page. Everything else is per-section — `section-hero.css` is requested only by
pages that use the hero — so no page downloads CSS it does not use.

No `!important`, no inline styles beyond CSS custom properties carrying
merchant settings, and no deep specificity.

### JavaScript

Roughly 15 KB unminified across five files, and the site works without any of
it.

| File | Loaded | Purpose |
|---|---|---|
| `global.js` | every page | Shared helpers, disclosure panels, scroll reveal, auto-submitting sort forms |
| `mobile-menu.js` | with the header | Focus trap, scroll lock, Escape and overlay close for the menu drawer |
| `carousel.js` | with a slider section | Prev/next, accessible autoplay with a pause control |
| `product-form.js` | product page | Live variant switching |
| `video-banner.js` | with a video section | Deferred YouTube/Vimeo embed, reduced-motion handling |

**Everything is a custom element.** They mount in `connectedCallback` and tear
down in `disconnectedCallback`, so a section that the Theme Editor adds,
removes, reorders or re-renders is wired up and cleaned up automatically. There
is no `shopify:section:load` bookkeeping, no duplicated listeners and no
intervals left running behind a removed section.

Files share one `window.SheerRoots` namespace rather than importing from each
other: Shopify serves assets from hashed CDN URLs, which makes relative ES
module specifiers between asset files impractical.

### Working without JavaScript

Every part of browsing and buying works with scripting disabled:

- The menu drawer and nav dropdowns are native `<details>` elements.
- Variant options are real links to variant URLs; JavaScript upgrades them to
  in-place updates.
- Add to cart, cart updates, contact form, search and sorting are ordinary form
  submissions — the sort form carries a submit button inside `<noscript>`.
- Accordions are native `<details>`.
- The carousel track is a scroll-snap list you can swipe or scroll; the buttons
  are the enhancement.

---

## Section reference

| Section | Used on | Notes |
|---|---|---|
| `announcement-bar` | header group | CSS marquee, pauses on hover, static under reduced motion |
| `header` | header group | Shopify menu, search, socials, cart, drawer under 990px |
| `footer` | footer group | Brand / Menu / Contact / Text blocks |
| `hero-banner` | anywhere | Desktop + mobile images, 5 heights, 7 text positions |
| `rich-text` | anywhere | Eyebrow, heading, text, quote, divider, button blocks |
| `image-with-text` | anywhere | Logo, eyebrow, heading, tagline, text, quote, button blocks |
| `multicolumn` | anywhere | 2–5 columns, optional images and dividers |
| `featured-collection` | anywhere | Slider or grid, driven by a collection |
| `video-banner` | anywhere | Shopify-hosted video or a YouTube/Vimeo link |
| `social-follow` | anywhere | Labelled links plus an optional image row |
| `contact-details` | anywhere | Address, phone, email, static map image |
| `contact-form` | anywhere | Shopify's own contact form |
| `collapsible-content` | anywhere | FAQ accordion |
| `flexible-content` | anywhere | Blank canvas built from `blocks/` theme blocks |
| `collection-banner` | collection | Collection image or an override |
| `main-collection` | collection | Grid, sorting, pagination |
| `main-product` | product | Reorderable blocks, gallery, variant picker |
| `related-products` | product | From the product's own collection, no extra request |
| `main-page` | page | Renders the page's own content |
| `main-cart`, `main-search`, `main-blog`, `main-article`, `main-list-collections`, `main-404` | matching templates | |

---

## Accessibility and performance notes

**Accessibility**

- Semantic landmarks, one `<h1>` per page, ordered heading levels.
- Skip link, visible focus rings, full keyboard operation.
- The menu drawer traps focus, locks scroll, closes on Escape, and returns
  focus to its trigger.
- Autoplay respects WCAG 2.2.2 — a pause control is always present, motion
  stops on hover and focus, and never starts under `prefers-reduced-motion`.
- All animation and smooth scrolling is disabled under `prefers-reduced-motion`.
- Alt text is editable for every merchant-supplied image; decorative images get
  an empty `alt`.
- Sold-out variants stay selectable so the customer can see what exists.

**Performance**

- Hero images are `loading="eager"` with `fetchpriority="high"`; everything else
  is lazy.
- Responsive `srcset` on every image, with genuinely art-directed
  `<picture>` sources where a mobile crop is provided.
- Section CSS loads only with its section.
- YouTube and Vimeo embeds load on click, not on page load.
- Fonts use `font-display: swap` and Shopify's font CDN.
- No third-party libraries, no polyfills, no bundler runtime.

---

## Known limits

- **Fonts.** Heading and body default to Assistant, which is guaranteed present
  in Shopify's font library. Pick something with more character — Playfair
  Display, Marcellus, Cardo — under *Theme settings → Typography*; the type
  scale, uppercase treatment and letter spacing are designed to hold up
  regardless of family.
- **No cart drawer.** Adding to cart navigates to the cart page. This keeps the
  theme free of cart-state JavaScript and works without scripting. A drawer can
  be added later without touching anything else.
- **Related products** come from the product's first collection rather than
  Shopify's recommendations API, which would need a client-side request.
