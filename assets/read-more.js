/* ==========================================================================
   <sr-read-more>
   Clips long rich text to a preview height and adds a Read more / Read less
   toggle.

   Progressive enhancement, deliberately in this direction: the server renders
   the full text and this element clips it on connect. If the script never
   runs, the visitor sees the complete description — nothing is hidden behind
   a control that cannot work. Nothing is truncated server-side either, so the
   full Shopify product description is always in the page for search engines.

   The toggle is only added when the content is genuinely taller than the
   preview, so short descriptions never get a pointless "Read more".
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class ReadMore extends HTMLElement {
    connectedCallback() {
      this.content = this.querySelector('[data-read-more-content]');
      if (!this.content) return;

      this.expanded = false;
      this.onToggle = this.onToggle.bind(this);
      this.onResize = this.onResize.bind(this);

      if (!this.content.id) {
        this.content.id = 'read-more-' + Math.random().toString(36).slice(2, 9);
      }

      this.evaluate();
      window.addEventListener('resize', this.onResize);
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
      window.clearTimeout(this.resizeDebounce);
      if (this.button) this.button.removeEventListener('click', this.onToggle);
    }

    /** Decide whether clipping is needed at the current width. */
    evaluate() {
      // Measure against the unclipped height.
      this.classList.remove('is-clipped');
      const previewHeight = parseInt(getComputedStyle(this).getPropertyValue('--read-more-height'), 10) || 200;
      const needsToggle = this.content.scrollHeight > previewHeight + 24;

      if (!needsToggle) {
        this.removeButton();
        return;
      }

      this.ensureButton();
      if (!this.expanded) this.classList.add('is-clipped');
    }

    ensureButton() {
      if (this.button) return;

      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.className = 'read-more__toggle button button--link';
      this.button.setAttribute('aria-controls', this.content.id);
      this.button.addEventListener('click', this.onToggle);
      this.appendChild(this.button);
      this.syncButton();
    }

    removeButton() {
      if (!this.button) return;
      this.button.removeEventListener('click', this.onToggle);
      this.button.remove();
      this.button = null;
    }

    syncButton() {
      if (!this.button) return;
      this.button.textContent = this.expanded
        ? this.dataset.lessLabel || 'Read less'
        : this.dataset.moreLabel || 'Read more';
      this.button.setAttribute('aria-expanded', this.expanded ? 'true' : 'false');
    }

    onToggle() {
      this.expanded = !this.expanded;
      this.classList.toggle('is-clipped', !this.expanded);
      this.syncButton();

      // Collapsing from far down the text would otherwise leave the visitor
      // staring at whatever ended up under their scroll position.
      if (!this.expanded) {
        const top = this.getBoundingClientRect().top;
        if (top < 0) {
          this.scrollIntoView({
            block: 'start',
            behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth'
          });
        }
      }
    }

    onResize() {
      window.clearTimeout(this.resizeDebounce);
      this.resizeDebounce = window.setTimeout(() => {
        // A wider viewport can make the same text short enough to not need
        // clipping at all.
        if (!this.expanded) this.evaluate();
      }, 150);
    }
  }

  SR.define('sr-read-more', ReadMore);
})(window.SheerRoots);
