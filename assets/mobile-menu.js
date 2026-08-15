/* ==========================================================================
   <sr-menu-drawer>
   Progressive enhancement over a native <details> element: without JavaScript
   the drawer still opens and closes. With JavaScript it also traps focus,
   locks body scroll, closes on Escape and closes when the overlay is clicked.
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class MenuDrawer extends HTMLElement {
    connectedCallback() {
      this.details = this.querySelector('details');
      if (!this.details) return;

      this.summary = this.details.querySelector('summary');
      this.panel = this.querySelector('.menu-drawer__panel');
      this.releaseFocus = null;

      this.onToggle = this.onToggle.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onBreakpointChange = this.onBreakpointChange.bind(this);

      this.desktop = window.matchMedia('(min-width: 990px)');

      this.details.addEventListener('toggle', this.onToggle);
      this.addEventListener('keydown', this.onKeydown);
      this.addEventListener('click', this.onClick);

      if (this.desktop.addEventListener) {
        this.desktop.addEventListener('change', this.onBreakpointChange);
      }
    }

    disconnectedCallback() {
      if (!this.details) return;

      // A section removed by the Theme Editor must not leave the page locked.
      if (this.details.open) this.teardownOpenState();

      this.details.removeEventListener('toggle', this.onToggle);
      this.removeEventListener('keydown', this.onKeydown);
      this.removeEventListener('click', this.onClick);

      if (this.desktop && this.desktop.removeEventListener) {
        this.desktop.removeEventListener('change', this.onBreakpointChange);
      }
    }

    onToggle() {
      if (this.details.open) {
        SR.lockScroll();
        this.releaseFocus = SR.trapFocus(this.panel || this.details, this.panel);
      } else {
        this.teardownOpenState();
      }
    }

    teardownOpenState() {
      SR.unlockScroll();
      if (this.releaseFocus) {
        this.releaseFocus();
        this.releaseFocus = null;
      }
    }

    onClick(event) {
      if (event.target.closest('[data-drawer-overlay], [data-drawer-close]')) {
        event.preventDefault();
        this.close();
      }
    }

    onKeydown(event) {
      if (event.key === 'Escape' && this.details.open) {
        this.close();
      }
    }

    onBreakpointChange(event) {
      // Rotating a phone into a desktop-width layout would otherwise strand
      // the drawer open behind a hidden trigger.
      if (event.matches && this.details.open) this.close();
    }

    close() {
      this.details.open = false;
      if (this.summary) this.summary.focus({ preventScroll: true });
    }
  }

  SR.define('sr-menu-drawer', MenuDrawer);
})(window.SheerRoots);
