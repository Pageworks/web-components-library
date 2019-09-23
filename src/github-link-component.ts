class GithubLinkComponent extends HTMLElement
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
        let cleanHref = e.detail.href.replace(window.location.origin, '');
        const newHref = `https://github.com/pageworks/web-components-library/tree/master/src/${ cleanHref.replace(/^[\/]/g, '') }`;
        this._link.href = newHref;
    }

    connectedCallback()
    {
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
}

customElements.define('github-link-component', GithubLinkComponent);