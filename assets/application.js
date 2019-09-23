var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Application {
    constructor() {
        this.handlePageLoadEvent = this.run.bind(this);
        this.initial = true;
        this._demoView = document.body.querySelector('demo-view');
        this.run();
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
    getStylesheets() {
        return new Promise((resolve) => {
            if (!stylesheets.length) {
                resolve();
            }
            let count = 0;
            const requiredCount = stylesheets.length;
            while (stylesheets.length) {
                let element = document.head.querySelector(`style[file="${stylesheets[0]}.css"]`);
                if (!element) {
                    element = document.createElement('style');
                    element.setAttribute('file', `${stylesheets[0]}.css`);
                    document.head.appendChild(element);
                    fetch(`${window.location.origin}/assets/${document.documentElement.dataset.cachebust}/${stylesheets[0]}.css`)
                        .then(request => request.text())
                        .then(response => {
                        element.innerHTML = response;
                    })
                        .catch(error => {
                        console.error(error);
                    })
                        .then(() => {
                        count++;
                        if (count === requiredCount) {
                            resolve();
                        }
                    });
                }
                else {
                    count++;
                    if (count === requiredCount) {
                        resolve();
                    }
                }
                stylesheets.splice(0, 1);
            }
        });
    }
    getModules() {
        return new Promise((resolve) => {
            if (!modules.length) {
                resolve();
            }
            let count = 0;
            const requiredCount = modules.length;
            while (modules.length) {
                let element = document.head.querySelector(`script[file="${modules[0]}.js"]`);
                if (!element) {
                    element = document.createElement('script');
                    element.setAttribute('file', `${modules[0]}.js`);
                    document.head.appendChild(element);
                    fetch(`${window.location.origin}/assets/${document.documentElement.dataset.cachebust}/${modules[0]}.js`)
                        .then(request => request.text())
                        .then(response => {
                        element.innerHTML = response;
                    })
                        .catch(error => {
                        console.error(error);
                    })
                        .then(() => {
                        count++;
                        if (count === requiredCount) {
                            resolve();
                        }
                    });
                }
                else {
                    count++;
                    if (count === requiredCount) {
                        resolve();
                    }
                }
                modules.splice(0, 1);
            }
        });
    }
    getComponents() {
        return new Promise((resolve) => {
            if (!components.length) {
                resolve();
            }
            let count = 0;
            const requiredCount = components.length;
            while (components.length) {
                let element = document.head.querySelector(`script[file="${components[0]}.js"]`);
                if (!element) {
                    element = document.createElement('script');
                    element.setAttribute('file', `${components[0]}.js`);
                    document.head.appendChild(element);
                    fetch(`${window.location.origin}/assets/${document.documentElement.dataset.cachebust}/${components[0]}.js`)
                        .then(request => request.text())
                        .then(response => {
                        element.innerHTML = response;
                    })
                        .catch(error => {
                        console.error(error);
                    })
                        .then(() => {
                        count++;
                        if (count === requiredCount) {
                            resolve();
                        }
                    });
                }
                else {
                    count++;
                    if (count === requiredCount) {
                        resolve();
                    }
                }
                components.splice(0, 1);
            }
        });
    }
    finishLoading() {
        setTimeout(() => {
            document.documentElement.classList.remove('is-loading');
            this._demoView.classList.remove('is-loading');
        }, 300);
        if (this.initial) {
            this.initial = false;
            navigationManager.loadComponent(window.location.href.replace(/\/$/, ''));
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.getStylesheets();
                yield this.getModules();
                yield this.getComponents();
                this.finishLoading();
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
new Application();
