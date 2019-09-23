class NavigationComponent extends HTMLElement
{
    private handleClickEvent:EventListener = this.navigate.bind(this);
    private handlePageLoadEvent:EventListener = this.checkPage.bind(this);

    private checkPage(e:CustomEvent) : void
    {
        if (e.detail.href === this.dataset.href)
        {
            this.classList.add('is-active');
        }
        else
        {
            this.classList.remove('is-active');
        }
    }

    private navigate() : void
    {
        navigationManager.loadComponent(this.dataset.href);
    }

    connectedCallback()
    {
        this.addEventListener('click', this.handleClickEvent);
        window.addEventListener('page-load', this.handlePageLoadEvent);

        if (window.location.href === this.dataset.href || window.location.href === `${ this.dataset.href }/`)
        {
            this.classList.add('is-active');
        }
    }
}

customElements.define('navigation-component', NavigationComponent);