class SolidInputComponent extends HTMLElement {
    constructor() {
        super();
        this.handleBlurEvent = this.validate.bind(this);
        this._input = this.querySelector('input');
    }
    validate() {
        if (this._input.value === '') {
            this._input.classList.remove('has-value');
        }
        else {
            this._input.classList.add('has-value');
        }
        if (!this._input.validity.valid && !this._input.classList.contains('is-invalid')) {
            this._input.classList.add('is-invalid');
            this._input.reportValidity();
        }
        else {
            this._input.classList.remove('is-invalid');
        }
    }
    connectedCallback() {
        this._input.addEventListener('blur', this.handleBlurEvent);
    }
}
customElements.define('solid-input-component', SolidInputComponent);
