class ComponentNavigation extends HTMLElement
{
    private navigationComponentTemplate : HTMLTemplateElement;

    constructor()
    {
        super();
        this.navigationComponentTemplate = document.body.querySelector('template[tag="navigation"]');
    }

    private fetchNavigation() : void
    {
        fetch(`${ window.location.origin }/assets/navigation.json`, {
            headers: new Headers({
                'Content-Type': 'application/json',
            })
        })
        .then((request => request.json()))
        .then(response => {
            for (const key of Object.keys(response))
            {
                const node = document.importNode(this.navigationComponentTemplate.content, true);
                const navigationDropdownComponent = document.createElement('navigation-dropdown-component');
                const input = node.querySelector('input');
                const label = node.querySelector('label');
                const span = node.querySelector('span');
                const componentLinks = node.querySelector('components-wrapper');
                
                navigationDropdownComponent.dataset.category = key;
                input.id = key;
                label.setAttribute('for', key);
                span.innerText = key.replace(/\-/g, ' ').trim();

                for (let i = 0; i < response[key].length; i++)
                {
                    const newComponent = document.createElement('navigation-component');
                    newComponent.innerText = response[key][i].replace(/\-/g, ' ').trim();
                    newComponent.dataset.href = `${ window.location.origin }/${ key }/${ response[key][i] }`;
                    componentLinks.appendChild(newComponent);
                }

                navigationDropdownComponent.append(node);
                this.appendChild(navigationDropdownComponent);
            }
        })
        .catch(error => {
            console.error('Failed to fetch navigation file', error);
        });
    }

    connectedCallback()
    {
        this.fetchNavigation();
    }
}

customElements.define('component-navigation', ComponentNavigation);