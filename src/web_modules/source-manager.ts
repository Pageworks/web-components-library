class SourceManager
{
    public switchView(view:string) : void
    {
        const switchViewEvent = new CustomEvent('switch-view', { 
            detail: {
                view: view,
            }
        });
        window.dispatchEvent(switchViewEvent);
    }
}

// @ts-ignore
window.sourceManager = new SourceManager();