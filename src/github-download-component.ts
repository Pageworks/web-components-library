class GithubDownloadComponent extends HTMLElement
{
    private _link : HTMLAnchorElement;

    constructor()
    {
        super();
        this._link = this.querySelector('a');
    }

    private handlePageLoadEvent:EventListener = this.updateLink.bind(this);

    private updateLink(e:CustomEvent) : void
    {
        const newHref = `${ window.location.origin }/assets/downloads/${ e.detail.category }/${ e.detail.component }.zip`;
        this._link.href = newHref;
        this._link.download = `${ e.detail.component }.zip`;
    }

    connectedCallback()
    {
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
}
customElements.define('github-download-component', GithubDownloadComponent);