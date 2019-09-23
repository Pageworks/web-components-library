class GithubDownloadComponent extends HTMLElement {
    constructor() {
        super();
        this.handlePageLoadEvent = this.updateLink.bind(this);
        this._link = this.querySelector('a');
    }
    updateLink(e) {
        const newHref = `${window.location.origin}/assets/downloads/${e.detail.category}/${e.detail.component}.zip`;
        this._link.href = newHref;
        this._link.download = `${e.detail.component}.zip`;
    }
    connectedCallback() {
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
}
customElements.define('github-download-component', GithubDownloadComponent);
