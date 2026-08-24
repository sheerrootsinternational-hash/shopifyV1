/* ==========================================================================
   <sr-carousel>
   A scroll-snap carousel. The track is a normal horizontally scrollable list,
   so with JavaScript disabled (or before this file loads) visitors can still
   swipe or scroll through every slide — the controls are the enhancement.

   Autoplay follows WCAG 2.2.2: it exposes a pause control, stops on hover,
   focus and tab-hide, and never starts for visitors who prefer reduced motion.
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class Carousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-carousel-track]');
      if (!this.track) return;

      this.slides = Array.prototype.slice.call(this.track.children);
      this.controls = this.querySelector('[data-carousel-controls]');
      this.prevButton = this.querySelector('[data-carousel-prev]');
      this.nextButton = this.querySelector('[data-carousel-next]');
      this.toggleButton = this.querySelector('[data-carousel-toggle]');
      this.status = this.querySelector('[data-carousel-status]');

      this.dots = this.querySelector('[data-carousel-dots]');
      this.autoplayRequested = this.dataset.autoplay === 'true';
      this.loop = this.dataset.loop === 'true';
      this.interval = parseInt(this.dataset.autoplayInterval, 10) || 5000;
      this.timer = null;
      this.playing = false;

      this.onPrev = this.onPrev.bind(this);
      this.onNext = this.onNext.bind(this);
      this.onToggle = this.onToggle.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      this.pause = this.pause.bind(this);
      this.resume = this.resume.bind(this);

      if (this.prevButton) this.prevButton.addEventListener('click', this.onPrev);
      if (this.nextButton) this.nextButton.addEventListener('click', this.onNext);
      if (this.toggleButton) this.toggleButton.addEventListener('click', this.onToggle);

      this.track.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize);
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      this.addEventListener('mouseenter', this.pause);
      this.addEventListener('mouseleave', this.resume);
      this.addEventListener('focusin', this.pause);
      this.addEventListener('focusout', this.resume);

      this.buildDots();
      this.refresh();

      if (this.autoplayRequested && !SR.prefersReducedMotion() && this.isScrollable()) {
        this.play();
      } else if (this.toggleButton) {
        this.updateToggleLabel();
      }
    }

    disconnectedCallback() {
      // The Theme Editor can remove this section at any moment; make sure the
      // interval and the window/document listeners go with it.
      this.stop();
      if (this.prevButton) this.prevButton.removeEventListener('click', this.onPrev);
      if (this.nextButton) this.nextButton.removeEventListener('click', this.onNext);
      if (this.toggleButton) this.toggleButton.removeEventListener('click', this.onToggle);
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.removeEventListener('mouseenter', this.pause);
      this.removeEventListener('mouseleave', this.resume);
      this.removeEventListener('focusin', this.pause);
      this.removeEventListener('focusout', this.resume);
    }

    isScrollable() {
      return this.track.scrollWidth - this.track.clientWidth > 4;
    }

    /**
     * One dot per slide. Built here rather than in Liquid so the count always
     * matches the slides actually rendered.
     */
    buildDots() {
      if (!this.dots) return;

      this.dots.innerHTML = '';
      this.dotButtons = this.slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', (this.dots.dataset.dotLabel || 'Go to item') + ' ' + (index + 1));
        dot.addEventListener('click', () => {
          this.stop();
          this.track.scrollTo({
            left: slide.offsetLeft - this.track.offsetLeft,
            behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth'
          });
        });
        this.dots.appendChild(dot);
        return dot;
      });
    }

    /** Marks the dot for the left-most fully visible slide. */
    updateDots() {
      if (!this.dotButtons || !this.dotButtons.length) return;
      const step = this.slideStep();
      const current = Math.round(this.track.scrollLeft / step);
      this.dotButtons.forEach((dot, index) => {
        const active = index === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    /** Width of one slide including the gap between slides. */
    slideStep() {
      if (this.slides.length < 2) return this.track.clientWidth;
      const first = this.slides[0].getBoundingClientRect();
      const second = this.slides[1].getBoundingClientRect();
      return Math.max(1, Math.round(second.left - first.left));
    }

    refresh() {
      const scrollable = this.isScrollable();

      // With everything visible there is nothing to control — hide the buttons
      // rather than show dead ones.
      if (this.controls) this.controls.hidden = !scrollable;
      if (this.dots) this.dots.hidden = !scrollable;

      if (!scrollable) {
        this.stop();
        return;
      }

      const atStart = this.track.scrollLeft <= 2;
      const atEnd = this.track.scrollLeft + this.track.clientWidth >= this.track.scrollWidth - 2;

      // When looping, the arrows always stay live because either end wraps.
      if (this.prevButton) this.prevButton.disabled = atStart && !this.loop;
      if (this.nextButton) this.nextButton.disabled = atEnd && !this.loop && !this.playing;

      this.updateDots();
    }

    scrollBySlides(direction) {
      this.track.scrollBy({
        left: this.slideStep() * direction,
        behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth'
      });
    }

    onPrev() {
      this.stop();
      if (this.loop && this.track.scrollLeft <= 2) {
        this.scrollToEnd();
        return;
      }
      this.scrollBySlides(-1);
    }

    onNext() {
      this.stop();
      const atEnd = this.track.scrollLeft + this.track.clientWidth >= this.track.scrollWidth - 2;
      if (this.loop && atEnd) {
        this.scrollToStart();
        return;
      }
      this.scrollBySlides(1);
    }

    scrollToStart() {
      this.track.scrollTo({ left: 0, behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    scrollToEnd() {
      this.track.scrollTo({
        left: this.track.scrollWidth,
        behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth'
      });
    }

    onScroll() {
      window.clearTimeout(this.scrollDebounce);
      this.scrollDebounce = window.setTimeout(() => this.refresh(), 80);
    }

    onResize() {
      window.clearTimeout(this.resizeDebounce);
      this.resizeDebounce = window.setTimeout(() => this.refresh(), 150);
    }

    onVisibilityChange() {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    }

    advance() {
      const atEnd = this.track.scrollLeft + this.track.clientWidth >= this.track.scrollWidth - 2;
      if (atEnd) {
        this.track.scrollTo({ left: 0, behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth' });
      } else {
        this.scrollBySlides(1);
      }
    }

    play() {
      if (this.playing || SR.prefersReducedMotion()) return;
      this.playing = true;
      this.timer = window.setInterval(() => this.advance(), this.interval);
      this.updateToggleLabel();
      this.refresh();
    }

    /** Temporary halt — autoplay resumes when the pointer or focus leaves. */
    pause() {
      if (!this.timer) return;
      window.clearInterval(this.timer);
      this.timer = null;
    }

    resume() {
      if (!this.playing || this.timer || document.hidden) return;
      if (this.matches(':hover') || this.contains(document.activeElement)) return;
      this.timer = window.setInterval(() => this.advance(), this.interval);
    }

    /** Permanent halt — the visitor took control. */
    stop() {
      this.pause();
      this.playing = false;
      this.updateToggleLabel();
    }

    onToggle() {
      if (this.playing) {
        this.stop();
        if (this.status) this.status.textContent = this.toggleButton.dataset.pausedText || '';
      } else {
        this.play();
      }
    }

    updateToggleLabel() {
      if (!this.toggleButton) return;
      const label = this.playing
        ? this.toggleButton.dataset.pauseLabel || 'Pause slideshow'
        : this.toggleButton.dataset.playLabel || 'Play slideshow';
      this.toggleButton.setAttribute('aria-label', label);
      this.toggleButton.classList.toggle('is-paused', !this.playing);
    }
  }

  SR.define('sr-carousel', Carousel);
})(window.SheerRoots);
