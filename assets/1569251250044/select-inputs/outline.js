class OutlineSelectComponent extends HTMLElement {
    constructor() {
        super();
        this.handleBlurEvent = this.validate.bind(this);
        this._select = this.querySelector('select');
    }
    validate() {
        if (this._select.value === '') {
            this._select.classList.remove('has-value');
        }
        else {
            this._select.classList.add('has-value');
        }
        if (!this._select.validity.valid) {
            this._select.classList.add('is-invalid');
            this._select.reportValidity();
        }
        else {
            this._select.classList.remove('is-invalid');
        }
    }
    connectedCallback() {
        this._select.addEventListener('blur', this.handleBlurEvent);
    }
}
customElements.define('outline-select-component', OutlineSelectComponent);
