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
    fetchFile(element, filename, filetype) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const request = yield fetch(`${window.location.origin}/assets/${document.documentElement.dataset.cachebust}/${filename}.${filetype}`);
                if (request.ok) {
                    const response = yield request.blob();
                    const fileUrl = URL.createObjectURL(response);
                    switch (filetype) {
                        case 'css':
                            element.setAttribute('rel', 'stylesheet');
                            element.setAttribute('href', fileUrl);
                            break;
                        case 'js':
                            element.setAttribute('type', 'text/javascript');
                            element.setAttribute('src', fileUrl);
                            break;
                    }
                    return;
                }
                else {
                    throw `Failed to fetch ${filename}.${filetype} server responded with ${request.status}`;
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    fetchResources(fileListArray, element, filetype) {
        return new Promise((resolve) => {
            if (fileListArray.length === 0) {
                resolve();
            }
            let count = 0;
            const required = fileListArray.length;
            while (fileListArray.length > 0) {
                let el = document.head.querySelector(`${element}[file="${fileListArray[0]}.${filetype}"]`);
                if (!el) {
                    el = document.createElement(element);
                    el.setAttribute('file', `${fileListArray[0]}.${filetype}`);
                    document.head.append(el);
                    this.fetchFile(el, fileListArray[0], filetype)
                        .then(() => {
                        el.addEventListener('load', () => {
                            count++;
                            if (count === required) {
                                resolve();
                            }
                        });
                    })
                        .catch(error => {
                        console.error(error);
                        count++;
                        if (count === required) {
                            resolve();
                        }
                    });
                }
                else {
                    count++;
                    if (count === required) {
                        resolve();
                    }
                }
                fileListArray.splice(0, 1);
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
                yield this.fetchResources(window.criticalCss, 'link', 'css');
                yield this.fetchResources(window.stylesheets, 'link', 'css');
                yield this.fetchResources(window.modules, 'script', 'js');
                yield this.fetchResources(window.criticalComponents, 'script', 'js');
                yield this.fetchResources(window.components, 'script', 'js');
                this.finishLoading();
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
new Application();
