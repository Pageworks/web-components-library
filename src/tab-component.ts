class TabComponent extends HTMLElement
{
    private _view : HTMLElement;
    
    private handleClickEvent:EventListener = this.activate.bind(this);
    private handleViewSwitchEvent:EventListener = this.manageView.bind(this);

    private manageView(e:CustomEvent) : void
    {
        if (e.detail.view === this.dataset.view)
        {
            this._view.classList.remove('is-hidden');
            hljs.highlightBlock(this._view);
            this.classList.add('is-active');
        }
        else
        {
            this._view.classList.add('is-hidden');
            this.classList.remove('is-active');
        }
    }

    private activate() : void
    {
        sourceManager.switchView(this.dataset.view);
    }

    connectedCallback()
    {
        this._view = document.body.querySelector(`code[data-view="${ this.dataset.view }"]`);
        this.addEventListener('click', this.handleClickEvent);
        window.addEventListener('switch-view',this.handleViewSwitchEvent);
    }
}

customElements.define('tab-component', TabComponent);