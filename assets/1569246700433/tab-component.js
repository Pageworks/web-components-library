class TabComponent extends HTMLElement {
    constructor() {
        super(...arguments);
        this.handleClickEvent = this.activate.bind(this);
        this.handleViewSwitchEvent = this.manageView.bind(this);
    }
    manageView(e) {
        if (e.detail.view === this.dataset.view) {
            this._view.classList.remove('is-hidden');
            hljs.highlightBlock(this._view);
            this.classList.add('is-active');
        }
        else {
            this._view.classList.add('is-hidden');
            this.classList.remove('is-active');
        }
    }
    activate() {
        sourceManager.switchView(this.dataset.view);
    }
    connectedCallback() {
        this._view = document.body.querySelector(`code[data-view="${this.dataset.view}"]`);
        this.addEventListener('click', this.handleClickEvent);
        window.addEventListener('switch-view', this.handleViewSwitchEvent);
    }
}
customElements.define('tab-component', TabComponent);
