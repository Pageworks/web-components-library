class SourceManager {
    switchView(view) {
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
