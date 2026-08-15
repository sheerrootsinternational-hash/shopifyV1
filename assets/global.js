/* ==========================================================================
   Sheer Roots — global
   Shared helpers plus the two behaviours every page needs: disclosure panels
   and scroll reveal.

   Architecture note
   -----------------
   Interactive behaviour is implemented with custom elements rather than
   `DOMContentLoaded` handlers. Custom elements mount in `connectedCallback`
   and tear down in `disconnectedCallback`, so a section that Shopify's Theme
   Editor removes, re-renders or reorders is wired up (and cleaned up) for free
   — no `shopify:section:load` bookkeeping and no duplicated listeners.

   Files are plain deferred scripts sharing one `window.SheerRoots` namespace.
   Shopify serves assets from hashed CDN URLs, which makes relative ES module
   imports between asset files impractical, so a namespace is the pragmatic
   equivalent here.
   ========================================================================== */

window.SheerRoots = window.SheerRoots || {};

(function (SR) {
  'use strict';

  /** Register a custom element once, tolerating duplicate script loads. */
  SR.define = function define(name, constructor) {
    if (!window.customElements || customElements.get(name)) return;
    customElements.define(name, constructor);
  };

  SR.prefersReducedMotion = function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  SR.FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), details > summary, [tabindex]:not([tabindex="-1"])';

  /**
   * Trap Tab focus inside `container`. Returns a function that releases it.
   */
  SR.trapFocus = function trapFocus(container, elementToFocus) {
    const focusable = () =>
      Array.prototype.filter.call(container.querySelectorAll(SR.FOCUSABLE), (el) => el.offsetParent !== null);

    function handleKeydown(event) {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    (elementToFocus || focusable()[0] || container).focus({ preventScroll: true });

    return function release() {
      document.removeEventListener('keydown', handleKeydown);
    };
  };

  /** Lock body scroll while an overlay is open, reference counted. */
  let scrollLocks = 0;
  SR.lockScroll = function lockScroll() {
    scrollLocks += 1;
    document.body.style.overflow = 'hidden';
  };
  SR.unlockScroll = function unlockScroll() {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.style.overflow = '';
  };

  /**
   * Format an amount in cents using the shop's money format string.
   *
   * Must match Shopify's `money` filter exactly, otherwise a price updated by
   * the variant picker would not match the one rendered by Liquid. The
   * placeholder inside the format string decides decimals and separators.
   */
  SR.formatMoney = function formatMoney(cents, format) {
    if (typeof cents !== 'number' || isNaN(cents)) return '';

    const template = format || '{{amount}}';
    const match = template.match(/\{\{\s*(\w+)\s*\}\}/);
    const placeholder = match ? match[1] : 'amount';

    function group(number, decimals, thousands, decimal) {
      const value = (number / 100).toFixed(decimals);
      const parts = value.split('.');
      const whole = parts[0].replace(/(\d)(?=(\d{3})+$)/g, '$1' + thousands);
      return parts[1] ? whole + decimal + parts[1] : whole;
    }

    let amount;
    switch (placeholder) {
      case 'amount_no_decimals':
        amount = group(cents, 0, ',', '.');
        break;
      case 'amount_with_comma_separator':
        amount = group(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        amount = group(cents, 0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        amount = group(cents, 2, "'", '.');
        break;
      case 'amount_with_space_separator':
        amount = group(cents, 2, ' ', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        amount = group(cents, 0, ' ', '.');
        break;
      case 'amount_with_period_and_space_separator':
        amount = group(cents, 2, ' ', '.');
        break;
      default:
        amount = group(cents, 2, ',', '.');
    }

    return template.replace(/\{\{\s*\w+\s*\}\}/, amount);
  };

  /* ------------------------------------------------------------------ */
  /* <sr-disclosure> — closes a <details> panel on Escape / outside click */
  /* ------------------------------------------------------------------ */

  class Disclosure extends HTMLElement {
    connectedCallback() {
      this.details = this.querySelector('details');
      if (!this.details) return;
      this.summary = this.details.querySelector('summary');

      this.onKeydown = this.onKeydown.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onToggle = this.onToggle.bind(this);

      this.details.addEventListener('toggle', this.onToggle);
      this.addEventListener('keydown', this.onKeydown);
    }

    disconnectedCallback() {
      if (!this.details) return;
      this.details.removeEventListener('toggle', this.onToggle);
      this.removeEventListener('keydown', this.onKeydown);
      document.removeEventListener('click', this.onDocumentClick);
    }

    onToggle() {
      if (this.details.open) {
        document.addEventListener('click', this.onDocumentClick);
        const autofocus = this.details.querySelector('[data-autofocus]');
        if (autofocus) autofocus.focus({ preventScroll: true });
      } else {
        document.removeEventListener('click', this.onDocumentClick);
      }
    }

    onDocumentClick(event) {
      if (this.contains(event.target)) return;
      this.close();
    }

    onKeydown(event) {
      if (event.key !== 'Escape' || !this.details.open) return;
      this.close();
      if (this.summary) this.summary.focus();
    }

    close() {
      this.details.open = false;
    }
  }

  SR.define('sr-disclosure', Disclosure);

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */

  const revealObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
        )
      : null;

  function observeReveals(root) {
    const targets = (root || document).querySelectorAll('.scroll-reveal:not(.is-visible)');
    if (!revealObserver || SR.prefersReducedMotion()) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    targets.forEach((el) => revealObserver.observe(el));
  }

  SR.observeReveals = observeReveals;

  document.addEventListener('DOMContentLoaded', () => observeReveals());

  // Theme Editor: newly injected sections need their reveal targets observed.
  document.addEventListener('shopify:section:load', (event) => observeReveals(event.target));

  /* ------------------------------------------------------------------ */
  /* Auto-submitting filter/sort forms                                    */
  /* ------------------------------------------------------------------ */

  // The markup ships with a real submit button inside <noscript>, so these
  // forms work either way; this just removes the extra click.
  document.addEventListener('change', (event) => {
    const form = event.target.closest('form[data-auto-submit]');
    if (!form) return;
    form.submit();
  });

  /* ------------------------------------------------------------------ */
  /* Links that open a new tab get an accessible hint                     */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[target="_blank"]:not([aria-describedby])').forEach((link) => {
      link.setAttribute('aria-describedby', 'a11y-new-window-message');
      if (!link.getAttribute('rel')) link.setAttribute('rel', 'noopener noreferrer');
    });
  });
})(window.SheerRoots);
