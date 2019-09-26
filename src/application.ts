declare var stylesheets : Array<string>;
declare var modules : Array<string>;
declare var components : Array<string>;
declare var criticalCss : Array<string>;
declare var criticalComponents : Array<string>;

class Application
{
    private initial : boolean;
    private _demoView : HTMLElement;
    
    constructor()
    {
        this.initial = true;
        this._demoView = document.body.querySelector('demo-view');
        this.run();
        window.addEventListener('page-load', this.handlePageLoadEvent);
    }

    private handlePageLoadEvent:EventListener = this.run.bind(this);

    private async fetchFile(element:Element, filename:string, filetype:string)
    {
        try
        {
            const request = await fetch(`${ window.location.origin }/assets/${ document.documentElement.dataset.cachebust }/${ filename }.${ filetype }`);
            if (request.ok)
            {
                const response = await request.blob();
                const fileUrl = URL.createObjectURL(response);
                switch (filetype)
                {
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
            else
            {
                throw `Failed to fetch ${ filename }.${ filetype } server responded with ${ request.status }`;
            }

        }
        catch (error)
        {
            throw error;
        }
    }

    private fetchResources(fileListArray:Array<string>, element:string, filetype:string) : Promise<any>
    {
        return new Promise((resolve) => {
            if (fileListArray.length === 0)
            {
                resolve();
            }

            let count = 0;
            const required = fileListArray.length;

            while (fileListArray.length > 0)
            {
                let el = document.head.querySelector(`${ element }[file="${ fileListArray[0] }.${ filetype }"]`);
                if (!el)
                {
                    el = document.createElement(element);
                    el.setAttribute('file', `${ fileListArray[0] }.${ filetype }`);
                    document.head.append(el);
                    this.fetchFile(el, fileListArray[0], filetype)
                    .then(() => {
                        el.addEventListener('load', () => {
                            count++;
                            if (count === required)
                            {
                                resolve();
                            }
                        });
                    })
                    .catch(error => {
                        console.error(error);
                        count++;
                        if (count === required)
                        {
                            resolve();
                        }
                    });
                }
                else
                {
                    count++;
                    if (count === required)
                    {
                        resolve();
                    }
                }

                fileListArray.splice(0, 1);
            }
        });
    }

    private finishLoading() : void
    {
        setTimeout(()=>{
            document.documentElement.classList.remove('is-loading');
            this._demoView.classList.remove('is-loading');
        }, 300);

        if (this.initial)
        {
            this.initial = false;
            navigationManager.loadComponent(window.location.href.replace(/\/$/, ''));
        }
    }

    private async run()
    {
        try
        {
            await this.fetchResources(window.criticalCss, 'link', 'css');
            await this.fetchResources(window.stylesheets, 'link', 'css');
            await this.fetchResources(window.modules, 'script', 'js');
            await this.fetchResources(window.criticalComponents, 'script', 'js');
            await this.fetchResources(window.components, 'script', 'js');
            this.finishLoading();
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

new Application();