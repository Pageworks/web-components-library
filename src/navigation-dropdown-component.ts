class NavigationDropdownComponent extends HTMLElement
{
    connectedCallback()
    {
        if (window.location.pathname.match(this.dataset.category))
        {
            const input = this.querySelector('input');
            input.checked = true;
        }
    }
}

customElements.define('navigation-dropdown-component', NavigationDropdownComponent);