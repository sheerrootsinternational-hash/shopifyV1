/* ==========================================================================
   <sr-video>
   Two small jobs:
     1. Swap a cover image for a YouTube/Vimeo embed on click, so the iframe
        (and its third-party requests) never load unless asked for.
     2. Stop ambient autoplay for visitors who prefer reduced motion.
   Shopify-hosted videos render as a plain <video> element and need no script.
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class VideoBanner extends HTMLElement {
    connectedCallback() {
      this.trigger = this.querySelector('[data-video-trigger]');
      this.template = this.querySelector('[data-video-template]');

      if (this.trigger && this.template) {
        this.onTriggerClick = this.onTriggerClick.bind(this);
        this.trigger.addEventListener('click', this.onTriggerClick);
      }

      if (this.dataset.ambient === 'true') this.handleAmbient();
    }

    disconnectedCallback() {
      if (this.trigger && this.onTriggerClick) {
        this.trigger.removeEventListener('click', this.onTriggerClick);
      }
      // Releasing the media element stops a removed section from decoding
      // video in the background.
      const video = this.querySelector('video');
      if (video) video.pause();
    }

    onTriggerClick() {
      const embed = this.template.content.firstElementChild;
      if (!embed) return;

      const node = embed.cloneNode(true);
      this.trigger.replaceWith(node);
      this.trigger = null;

      // Move focus to the newly inserted player so keyboard users are not
      // stranded where the button used to be.
      if (typeof node.focus === 'function') {
        node.setAttribute('tabindex', '-1');
        node.focus({ preventScroll: true });
      }
    }

    handleAmbient() {
      const video = this.querySelector('video');
      if (!video) return;

      const query = window.matchMedia('(prefers-reduced-motion: reduce)');

      const apply = () => {
        if (query.matches) {
          video.pause();
          video.removeAttribute('autoplay');
          video.setAttribute('controls', 'controls');
        } else if (video.paused && video.hasAttribute('data-was-autoplay')) {
          video.removeAttribute('controls');
          const playback = video.play();
          if (playback && typeof playback.catch === 'function') playback.catch(() => {});
        }
      };

      video.setAttribute('data-was-autoplay', 'true');
      apply();

      if (query.addEventListener) {
        this.motionQuery = query;
        this.onMotionChange = apply;
        query.addEventListener('change', apply);
      }
    }
  }

  SR.define('sr-video', VideoBanner);
})(window.SheerRoots);
