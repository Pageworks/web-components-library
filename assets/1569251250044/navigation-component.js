class NavigationComponent extends HTMLElement {
    constructor() {
        super(...arguments);
        this.handleClickEvent = this.navigate.bind(this);
        this.handlePageLoadEvent = this.checkPage.bind(this);
    }
    checkPage(e) {
        if (e.detail.href === this.dataset.href) {
            this.classList.add('is-active');
        }
        else {
            this.classList.remove('is-active');
        }
    }
    navigate() {
        navigationManager.loadComponent(this.dataset.href);
    }
    connectedCallback() {
        this.addEventListener('click', this.handleClickEvent);
        window.addEventListener('page-load', this.handlePageLoadEvent);
        if (window.location.href === this.dataset.href || window.location.href === `${this.dataset.href}/`) {
            this.classList.add('is-active');
        }
    }
}
customElements.define('navigation-component', NavigationComponent);
