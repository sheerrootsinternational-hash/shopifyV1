/* ==========================================================================
   <sr-product>
   Enhances the link-based variant picker so switching an option updates the
   page in place instead of navigating. Everything it needs is already in the
   document as JSON, so no network request is made.

   Remove this file and the product page still works: the option links are real
   URLs and the add-to-cart form is a plain POST.
   ========================================================================== */

(function (SR) {
  'use strict';

  if (!SR) return;

  class ProductForm extends HTMLElement {
    connectedCallback() {
      const dataEl = this.querySelector('[data-variant-data]');
      if (!dataEl) return;

      try {
        this.data = JSON.parse(dataEl.textContent);
      } catch (error) {
        return; // Leave the plain-link behaviour in place.
      }

      this.picker = this.querySelector('[data-variant-picker]');
      if (!this.picker) return;

      this.priceContainer = this.querySelector('[data-product-price]');
      this.variantInput = this.querySelector('[data-variant-input]');
      this.addButton = this.querySelector('[data-add-button]');
      this.addButtonText = this.querySelector('[data-add-button-text]');
      this.mediaItems = Array.prototype.slice.call(this.querySelectorAll('[data-media-id]'));

      this.selected = this.currentOptions();

      this.onPickerClick = this.onPickerClick.bind(this);
      this.picker.addEventListener('click', this.onPickerClick);
    }

    disconnectedCallback() {
      if (this.picker && this.onPickerClick) {
        this.picker.removeEventListener('click', this.onPickerClick);
      }
    }

    currentOptions() {
      const selectedLinks = this.picker.querySelectorAll('.variant-picker__value.is-selected');
      const options = [];
      selectedLinks.forEach((link) => {
        options[parseInt(link.dataset.optionIndex, 10)] = link.dataset.optionValue;
      });
      return options;
    }

    onPickerClick(event) {
      const link = event.target.closest('.variant-picker__value');
      if (!link || !this.picker.contains(link)) return;

      event.preventDefault();

      const index = parseInt(link.dataset.optionIndex, 10);
      this.selected[index] = link.dataset.optionValue;

      const variant = this.findVariant(this.selected);

      this.markSelected(index, link);
      this.updateAvailabilityHints();

      if (!variant) {
        this.setUnavailable();
        return;
      }

      this.applyVariant(variant);
    }

    findVariant(options) {
      return (
        this.data.variants.find((variant) =>
          variant.options.every((value, index) => value === options[index])
        ) || null
      );
    }

    markSelected(index, link) {
      this.picker.querySelectorAll('[data-option-index="' + index + '"]').forEach((el) => {
        el.classList.remove('is-selected');
        el.removeAttribute('aria-current');
      });
      link.classList.add('is-selected');
      link.setAttribute('aria-current', 'true');

      const label = this.picker.querySelector('[data-selected-for="' + index + '"]');
      if (label) label.textContent = link.dataset.optionValue;
    }

    /** Dim option values that lead to a combination with no purchasable variant. */
    updateAvailabilityHints() {
      this.picker.querySelectorAll('.variant-picker__value').forEach((link) => {
        const index = parseInt(link.dataset.optionIndex, 10);
        const probe = this.selected.slice();
        probe[index] = link.dataset.optionValue;
        const match = this.findVariant(probe);
        link.classList.toggle('is-unavailable', !match || !match.available);
      });
    }

    applyVariant(variant) {
      if (this.variantInput) this.variantInput.value = variant.id;

      if (this.addButton) {
        this.addButton.disabled = !variant.available;
        if (this.addButtonText) {
          this.addButtonText.textContent = variant.available
            ? this.data.strings.addToCart
            : this.data.strings.soldOut;
        }
      }

      this.renderPrice(variant);
      this.showMedia(variant.featuredMediaId);

      if (variant.url && window.history && window.history.replaceState) {
        window.history.replaceState({}, '', variant.url);
      }
    }

    setUnavailable() {
      if (!this.addButton) return;
      this.addButton.disabled = true;
      if (this.addButtonText) this.addButtonText.textContent = this.data.strings.unavailable;
    }

    renderPrice(variant) {
      if (!this.priceContainer) return;
      const priceEl = this.priceContainer.querySelector('.price');
      if (!priceEl) return;

      const format = this.data.moneyFormat;
      const onSale = variant.compareAtPrice > variant.price;

      const parts = [];
      if (onSale) {
        parts.push('<s class="price__regular--compare">' + SR.formatMoney(variant.compareAtPrice, format) + '</s>');
        parts.push('<span class="price__sale">' + SR.formatMoney(variant.price, format) + '</span>');
      } else {
        parts.push('<span class="price__regular">' + SR.formatMoney(variant.price, format) + '</span>');
      }

      priceEl.classList.toggle('price--on-sale', onSale);
      priceEl.innerHTML = parts.join('');
    }

    showMedia(mediaId) {
      if (!mediaId || !this.mediaItems.length) return;
      const target = this.mediaItems.find((item) => item.dataset.mediaId === String(mediaId));
      if (!target) return;

      this.mediaItems.forEach((item) => item.classList.remove('is-active'));
      target.classList.add('is-active');

      // On mobile the gallery is a horizontal scroller; bring the variant's
      // image into view without yanking the whole page.
      if (target.parentElement && target.parentElement.scrollWidth > target.parentElement.clientWidth) {
        target.parentElement.scrollTo({
          left: target.offsetLeft - target.parentElement.offsetLeft,
          behavior: SR.prefersReducedMotion() ? 'auto' : 'smooth'
        });
      }
    }
  }

  SR.define('sr-product', ProductForm);
})(window.SheerRoots);
