/* ==========================================================================
   <sr-gallery>
   Main media viewport plus a thumbnail strip for the product page.

   The viewport is a scroll-snap track, the same pattern assets/carousel.js
   uses. That gives native touch swiping and momentum for free, and means the
   gallery degrades to a horizontally scrollable strip of every media item if
   this file never loads — nothing becomes unreachable.

   Public API (used by assets/product-form.js when a variant changes):
     gallery.selectByMediaId(id)
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-gallery-track]');
      if (!this.track) return;

      this.slides = Array.prototype.slice.call(this.track.querySelectorAll('[data-media-id]'));
      this.thumbs = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-thumb]'));
      this.thumbList = this.querySelector('[data-gallery-thumbs]');
      this.prevButton = this.querySelector('[data-gallery-prev]');
      this.nextButton = this.querySelector('[data-gallery-next]');
      this.status = this.querySelector('[data-gallery-status]');

      this.index = Math.max(
        0,
        this.slides.findIndex((slide) => slide.classList.contains('is-active'))
      );

      this.onPrev = this.onPrev.bind(this);
      this.onNext = this.onNext.bind(this);
      this.onThumbClick = this.onThumbClick.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.onResize = this.onResize.bind(this);

      if (this.prevButton) this.prevButton.addEventListener('click', this.onPrev);
      if (this.nextButton) this.nextButton.addEventListener('click', this.onNext);
      if (this.thumbList) this.thumbList.addEventListener('click', this.onThumbClick);
      this.track.addEventListener('scroll', this.onScroll, { passive: true });
      this.track.addEventListener('keydown', this.onKeydown);
      window.addEventListener('resize', this.onResize);

      this.select(this.index, { animate: false });
    }

    disconnectedCallback() {
      // The Theme Editor can swap this section out at any point.
      if (this.prevButton) this.prevButton.removeEventListener('click', this.onPrev);
      if (this.nextButton) this.nextButton.removeEventListener('click', this.onNext);
      if (this.thumbList) this.thumbList.removeEventListener('click', this.onThumbClick);
      if (this.track) {
        this.track.removeEventListener('scroll', this.onScroll);
        this.track.removeEventListener('keydown', this.onKeydown);
      }
      window.removeEventListener('resize', this.onResize);
      window.clearTimeout(this.scrollDebounce);

      // Stop any video that was playing in a removed gallery.
      this.querySelectorAll('video').forEach((video) => video.pause());
    }

    /** Move to a slide by position, keeping thumbnails and arrows in step. */
    select(index, options) {
      if (!this.slides.length) return;
      const settings = options || {};
      const clamped = Math.min(Math.max(index, 0), this.slides.length - 1);
      this.index = clamped;

      const slide = this.slides[clamped];
      const behavior = settings.animate === false || SR.prefersReducedMotion() ? 'auto' : 'smooth';

      this.track.scrollTo({ left: slide.offsetLeft - this.track.offsetLeft, behavior: behavior });

      this.syncState();
    }

    selectByMediaId(mediaId) {
      const index = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
      if (index !== -1) this.select(index);
    }

    syncState() {
      this.slides.forEach((slide, i) => {
        const active = i === this.index;
        slide.classList.toggle('is-active', active);
        // Only the visible slide should be reachable by tab.
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      this.thumbs.forEach((thumb, i) => {
        const active = i === this.index;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-current', active ? 'true' : 'false');
        if (active) this.scrollThumbIntoView(thumb);
      });

      if (this.prevButton) this.prevButton.disabled = this.index === 0;
      if (this.nextButton) this.nextButton.disabled = this.index === this.slides.length - 1;

      if (this.status && this.status.dataset.template) {
        this.status.textContent = this.status.dataset.template
          .replace('[index]', this.index + 1)
          .replace('[total]', this.slides.length);
      }
    }

    /** Keep the active thumbnail visible without scrolling the whole page. */
    scrollThumbIntoView(thumb) {
      if (!this.thumbList) return;
      const list = this.thumbList;
      const horizontal = list.scrollWidth > list.clientWidth + 2;
      const vertical = list.scrollHeight > list.clientHeight + 2;
      if (!horizontal && !vertical) return;

      const behavior = SR.prefersReducedMotion() ? 'auto' : 'smooth';
      if (horizontal) {
        const target = thumb.offsetLeft - list.offsetLeft - (list.clientWidth - thumb.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, target), behavior: behavior });
      } else {
        const target = thumb.offsetTop - list.offsetTop - (list.clientHeight - thumb.offsetHeight) / 2;
        list.scrollTo({ top: Math.max(0, target), behavior: behavior });
      }
    }

    onPrev() {
      this.select(this.index - 1);
    }

    onNext() {
      this.select(this.index + 1);
    }

    onThumbClick(event) {
      const thumb = event.target.closest('[data-gallery-thumb]');
      if (!thumb) return;
      event.preventDefault();
      const index = this.thumbs.indexOf(thumb);
      if (index !== -1) this.select(index);
    }

    /** Swiping updates the active thumbnail without fighting the scroll. */
    onScroll() {
      window.clearTimeout(this.scrollDebounce);
      this.scrollDebounce = window.setTimeout(() => {
        const width = this.track.clientWidth || 1;
        const index = Math.round(this.track.scrollLeft / width);
        if (index !== this.index && index >= 0 && index < this.slides.length) {
          this.index = index;
          this.syncState();
        }
      }, 90);
    }

    onKeydown(event) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.onNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.onPrev();
      }
    }

    onResize() {
      window.clearTimeout(this.resizeDebounce);
      // Re-align after a rotation or a Theme Editor width change.
      this.resizeDebounce = window.setTimeout(() => this.select(this.index, { animate: false }), 150);
    }
  }

  SR.define('sr-gallery', ProductGallery);
})(window.SheerRoots);
