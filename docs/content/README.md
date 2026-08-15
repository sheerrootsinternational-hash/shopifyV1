# Page copy for Shopify

These files hold the body copy for the pages whose text belongs to the merchant
rather than to the theme. They are **not** rendered by the theme and are not
uploaded to Shopify — Shopify ignores this directory.

## How to use them

1. In Shopify admin go to **Content → Pages** and create (or open) the page.
2. In the rich-text editor, open the `<>` **Show HTML** view.
3. Paste the contents of the matching file.
4. Save.

From then on the copy is edited in Shopify, exactly like any other page.

| File | Page title | Handle | Theme template |
|---|---|---|---|
| `terms-and-conditions.html` | Terms & Conditions | `terms-conditions` | `page` |
| `privacy-policy.html` | Privacy Policy | `privacy-policy` | `page` |
| `exchange-and-return.html` | Exchange & Return Policy | `exchange-return` | `page` |

**Orders & Shipping** has no file here. Its four questions ship inside the
`page.faq` template as an accordion, so they are edited in the Theme Editor
under *Collapsible content*. Create the page, leave its body empty, and assign
the `page.faq` template.

## Where this copy came from

Every word is taken from the supplied *HOME PAGE PREVIEW sheer roots* document.
Nothing has been invented, added or reworded. Only formatting has been applied:
headings, paragraphs and lists.

## Two things to confirm before publishing

1. **Email address.** The document uses `info@sheerroot.in` on the contact
   block and `info@sheerroots.in` throughout the privacy policy and the
   Orders & Shipping answers. The theme's *Contact details* setting currently
   holds `info@sheerroot.in`. Confirm which is correct and make it consistent.
2. **Placeholder in the return policy.** The Exchange & Return copy contains
   the literal text `[email address]`, which is in the source document. It is
   marked below and needs replacing with the real address.

## A note on Shopify's own policies

Shopify has dedicated policy fields under **Settings → Policies** (refund,
privacy, terms of service, shipping). Those are what the checkout links to and
what the footer's policy links use. If you want a single source of truth,
consider putting this copy there instead of, or as well as, these pages.
