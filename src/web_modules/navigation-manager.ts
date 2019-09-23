class NavigationManager
{
    public loadComponent(href:string) : void
    {
        const oldDemoView = document.body.querySelector('demo-view');
        oldDemoView.classList.add('is-loading');

        fetch(href)
        .then(request => request.text())
        .then(response => {
            const tempDocument = document.implementation.createHTMLDocument('temp-document');
            tempDocument.body.innerHTML = response;
            const newDemoView = tempDocument.body.querySelector('demo-view');
            oldDemoView.innerHTML = newDemoView.innerHTML;
            window.history.pushState({}, null, href);

            const scripts = Array.from(newDemoView.querySelectorAll('script'));
            for (let i = 0; i < scripts.length; i++)
            {
                const newScript = document.createElement('script');
                newScript.innerHTML = scripts[i].innerHTML;
                oldDemoView.appendChild(newScript);
            }

            let categoryName = window.location.pathname.match(/.*\//)[0];
            categoryName = categoryName.replace(/\//g, '').trim();
            const componentName = window.location.pathname.replace(/.*\//, '');
            
            const pageLoadEvent = new CustomEvent('page-load', { 
                detail: {
                    href: href,
                    category: categoryName,
                    component: componentName
                }
            });
            window.dispatchEvent(pageLoadEvent);
        })
        .catch(error => {
            console.error(error);
        })
    }
}

// @ts-ignore
window.navigationManager = new NavigationManager();