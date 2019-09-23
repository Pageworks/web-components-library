class GithubLinkComponent extends HTMLElement {
    constructor() {
        super();
        this.handlePageLoadEvent = this.updateLink.bind(this);
        this._link = this.querySelector('a');
    }
    updateLink(e) {
        let cleanHref = e.detail.href.replace(window.location.origin, '');
        const newHref = `https://github.com/pageworks/web-components-library/tree/master/src/${cleanHref.replace(/^[\/]/g, '')}`;
        this._link.href = newHref;
    }
    connectedCallback() {
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
}
customElements.define('github-link-component', GithubLinkComponent);
