var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class SourceViewComponent extends HTMLElement {
    constructor() {
        super();
        this.handlePageLoadEvent = this.load.bind(this);
        this._tabComponentTemplate = this.querySelector('template[tag="tab-component"]');
        this._tabsContainer = this.querySelector('tabs-container');
        this._sourceViews = this.querySelector('source-views');
    }
    loadRaw(category, component, filename, extension) {
        return new Promise((resolve, reject) => {
            fetch(`https://raw.githubusercontent.com/pageworks/web-components-library/master/src/${category}/${component}/${filename}.${extension}`)
                .then(request => {
                if (request.ok) {
                    request.text().then(response => {
                        resolve(response);
                    });
                }
                else {
                    reject(request.status);
                }
            })
                .catch(error => {
                reject(error);
            });
        });
    }
    load(e) {
        return __awaiter(this, void 0, void 0, function* () {
            this._tabsContainer.innerHTML = '';
            this._sourceViews.innerHTML = '';
            let hasDataModel = false;
            yield this.loadRaw(e.detail.category, e.detail.component, 'data', 'json')
                .then(html => {
                hasDataModel = true;
                const tab = document.createElement('tab-component');
                tab.innerText = 'DATA MODEL';
                tab.classList.add('is-active');
                tab.dataset.view = 'JSON';
                const sourceCode = document.createElement('code');
                sourceCode.innerText = html;
                sourceCode.dataset.view = 'JSON';
                sourceCode.classList.add('json');
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
                hljs.highlightBlock(sourceCode);
            })
                .catch(error => {
                if (error !== 404) {
                    console.error(error);
                }
            });
            yield this.loadRaw(e.detail.category, e.detail.component, 'index', 'html')
                .then(html => {
                const tab = document.createElement('tab-component');
                tab.innerText = 'HTML';
                tab.dataset.view = 'HTML';
                const sourceCode = document.createElement('code');
                sourceCode.innerText = html;
                sourceCode.dataset.view = 'HTML';
                sourceCode.classList.add('html');
                if (!hasDataModel) {
                    tab.classList.add('is-active');
                }
                else {
                    sourceCode.classList.add('is-hidden');
                }
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
                hljs.highlightBlock(sourceCode);
            })
                .catch(error => {
                if (error !== 404) {
                    console.error(error);
                }
            });
            yield this.loadRaw(e.detail.category, e.detail.component, e.detail.component, 'scss')
                .then(sass => {
                const tab = document.createElement('tab-component');
                tab.innerText = 'SASS';
                tab.dataset.view = 'SASS';
                const sourceCode = document.createElement('code');
                sourceCode.innerHTML = sass;
                sourceCode.dataset.view = 'SASS';
                sourceCode.classList.add('is-hidden');
                sourceCode.classList.add('sass');
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
            })
                .catch(error => {
                if (error !== 404) {
                    console.error(error);
                }
            });
            yield this.loadRaw(e.detail.category, e.detail.component, e.detail.component, 'ts')
                .then(typescriptData => {
                const tab = document.createElement('tab-component');
                tab.innerText = 'TypeScript';
                tab.dataset.view = 'TS';
                const sourceCode = document.createElement('code');
                sourceCode.innerHTML = typescriptData;
                sourceCode.dataset.view = 'TS';
                sourceCode.classList.add('is-hidden');
                sourceCode.classList.add('typescript');
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
            })
                .catch(error => {
                if (error !== 404) {
                    console.error(error);
                }
            });
            yield this.loadRaw(e.detail.category, e.detail.component, 'readme', 'md')
                .then(readmeData => {
                const tab = document.createElement('tab-component');
                tab.innerText = 'README';
                tab.dataset.view = 'README';
                const sourceCode = document.createElement('code');
                sourceCode.innerHTML = markdown.toHTML(readmeData);
                sourceCode.dataset.view = 'README';
                sourceCode.classList.add('is-hidden');
                sourceCode.classList.add('markdown');
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
            })
                .catch(error => {
                if (error === 404) {
                    const tab = document.createElement('tab-component');
                    tab.innerText = 'README';
                    tab.dataset.view = 'README';
                    const sourceCode = document.createElement('code');
                    sourceCode.innerHTML = `<p>No readme available. <a href="https://github.com/pageworks/web-components-library/new/master/src/${e.detail.category}/${e.detail.component}" target="_blank">Create one.</a></p>`;
                    sourceCode.dataset.view = 'README';
                    sourceCode.classList.add('is-hidden');
                    sourceCode.classList.add('markdown');
                    this._sourceViews.appendChild(sourceCode);
                    this._tabsContainer.appendChild(tab);
                }
                else {
                    console.error(error);
                }
            });
            yield this.loadRaw(e.detail.category, e.detail.component, 'changelog', 'md')
                .then(changelogData => {
                const tab = document.createElement('tab-component');
                tab.innerText = 'CHANGELOG';
                tab.dataset.view = 'CHANGELOG';
                const sourceCode = document.createElement('code');
                sourceCode.innerHTML = markdown.toHTML(changelogData);
                sourceCode.dataset.view = 'CHANGELOG';
                sourceCode.classList.add('is-hidden');
                sourceCode.classList.add('markdown');
                this._sourceViews.appendChild(sourceCode);
                this._tabsContainer.appendChild(tab);
            })
                .catch(error => {
                if (error === 404) {
                    const tab = document.createElement('tab-component');
                    tab.innerText = 'CHANGELOG';
                    tab.dataset.view = 'CHANGELOG';
                    const sourceCode = document.createElement('code');
                    sourceCode.innerHTML = `<p>No changelog available. <a href="https://github.com/pageworks/web-components-library/new/master/src/${e.detail.category}/${e.detail.component}" target="_blank">Create one.</a></p>`;
                    sourceCode.dataset.view = 'CHANGELOG';
                    sourceCode.classList.add('is-hidden');
                    sourceCode.classList.add('markdown');
                    this._sourceViews.appendChild(sourceCode);
                    this._tabsContainer.appendChild(tab);
                }
                else {
                    console.error(error);
                }
            });
        });
    }
    connectedCallback() {
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }
}
customElements.define('source-view-component', SourceViewComponent);
