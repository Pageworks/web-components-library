const fs = require('fs');
const glob = require('glob');
const sass = require('node-sass');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonjs = require('rollup-plugin-commonjs');
const archiver = require('archiver');

const projectPackage = require('./package.json');

class Compiler
{
    constructor()
    {
        this.run();
    }

    async run()
    {
        try
        {
            await this.removeAssetsDirectory();
            await this.createBuildDirectory();
            await this.createAssetsDirectory();
            await this.moveApplication();
            await this.moveWorker();
            const timestamp = Date.now();
            await this.createCachebustDirectory(timestamp);

            /** HTML */
            const htmlFiles = await this.getHtmlFiles();
            const demoHtmlFiles = await this.getDemoHtmlFiles();
            const homepageHtmlFile = await this.getHomepageHtmlFile();
            await this.updateHomepageHtml(homepageHtmlFile, timestamp);
            await this.updateHtmlFiles(htmlFiles, timestamp);
            await this.injectDemoHtmlFiles(demoHtmlFiles);

            /** Categories */
            await this.buildCategoryDirectories(timestamp);

            /** SASS */
            const sassFiles = await this.getSassFiles();
            const splitSassFiles = await this.splitSassFiles(sassFiles);
            await this.compileSass(splitSassFiles.verifiedFiles, timestamp);
            await this.compileDemoSass(splitSassFiles.demoFiles, timestamp);

            /** Web Components */
            const componentFiles = await this.getComponentFiles();
            await this.moveComponents(componentFiles.componentFiles, timestamp);
            await this.injectDemoScripts(componentFiles.demoFiles, timestamp);

            /** NPM Package Bundling */
            await this.removeBundleDirectory();
            await this.makeBundleDirectory();
            const dependencies = await this.getWebDependencies();
            const serverSafeBundleNames = await this.writeBundles(dependencies);
            await this.buildPackages(serverSafeBundleNames, timestamp);

            /** Build Navigation JSON */
            const categories = await this.getCategories();
            const components = await this.getComponents();
            const navigation = await this.buildNavigation(categories, components);
            await this.generateNavigationFile(navigation);

            /** Downloads */
            const componentDirectories = await this.getComponentDirectories();
            const downloads = await this.cleanDownloads(componentDirectories);
            await this.generatedDownloadsDirectory(downloads);
            await this.generateDownloads(downloads);
            await this.cleanupTempDirectories();
            
            await this.moveCNAME();
            await this.removeCompiledDirectory();
        }
        catch (error)
        {
            console.log(error);
        }
    }

    removeCompiledDirectory()
    {
        return new Promise((resolve, reject) => {
            fs.promises.access('_compiled')
            .then(() => {
                fs.rmdir('_compiled', { recursive: true }, (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                });
            })
            .catch(() => { resolve(); });
        });
    }

    moveCNAME()
    {
        return new Promise((resolve, reject) => {
            fs.promises.access('CNAME')
            .then(() => {
                fs.copyFile('CNAME', 'build/CNAME', (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                });
            })
            .catch(() => {
                resolve();
            });
        });
    }

    cleanupTempDirectories()
    {
        return new Promise((resolve, reject) => {
            fs.exists('_downloads', (exists) => {
                if (exists)
                {
                    fs.rmdir('_downloads', { recursive: true }, (error) => {
                        if (error)
                        {
                            reject(error);
                        }

                        resolve();
                    });
                }
                else
                {
                    resolve();
                }
            });
        });
    }

    generateDownloads(downloads)
    {
        return new Promise((resolve, reject) => {
            if (downloads.length === 0)
            {
                resolve();
            }
            let generated = 0;
            for (let i = 0; i < downloads.length; i++)
            {
                const category = downloads[i].category;
                const component = downloads[i].component;

                (async () => {
                    await fs.mkdir(`_downloads/${ category }/${ component }`, (error) => { if (error) { reject(error); } });
                    await fs.promises.access(`src/${ category }/${ component }/index.html`).then(() => {
                        fs.copyFileSync(`src/${ category }/${ component }/index.html`, `_downloads/${ category }/${ component }/index.html`, (error) => {
                            if (error)
                            {
                                reject(error);
                            }
                        });
                    }).catch(() => {});
                    await fs.promises.access(`src/${ category }/${ component }/${ component }.scss`).then(() => {
                        fs.copyFileSync(`src/${ category }/${ component }/${ component }.scss`, `_downloads/${ category }/${ component }/${ component }.scss`, (error) => {
                            if (error)
                            {
                                reject(error);
                            }
                        });
                    }).catch(() => {});
                    await fs.promises.access(`src/${ category }/${ component }/${ component }.ts`).then(() => {
                        fs.copyFileSync(`src/${ category }/${ component }/${ component }.ts`, `_downloads/${ category }/${ component }/${ component }.ts`, (error) => {
                            if (error)
                            {
                                reject(error);
                            }
                        });
                    }).catch(() => {});
                    const output = fs.createWriteStream(`build/assets/downloads/${ category }/${ component }.zip`);
                    const archive = archiver('zip', { zlib: { level: 9 } });
                    output.on('close', () => {
                        generated++;
                        if (generated === downloads.length)
                        {
                            resolve();
                        }
                    });
                    archive.pipe(output);
                    archive.directory(`_downloads/${ category }/${ component }`, `${ component }`);
                    archive.finalize();
                })();
            }
        });
    }

    cleanDownloads(components)
    {
        return new Promise((resolve) => {
            const downloads = [];
            for (let i = 0; i < components.length; i++)
            {
                const directory = components[i];
                const directories = directory.replace(/(src\/)|[\/]$/g, '').trim().toLowerCase().split('/');
                const componentName = directories[1];
                const categoryName = directories[0];

                if (componentName && categoryName)
                {
                    const download = {
                        component: componentName,
                        category: categoryName
                    };
                    downloads.push(download);
                }
            }

            resolve(downloads);
        });
    }

    generatedDownloadsDirectory(downloads)
    {
        return new Promise((resolve, reject) => {
            fs.mkdir('build/assets/downloads', (error) => {
                if (error)
                {
                    reject(error);
                }

                fs.mkdir('_downloads', (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    if (downloads.length === 0)
                    {
                        resolve();
                    }

                    let generated = 0;
                    const uniqueCategories = [];
                    for (let i = 0; i < downloads.length; i++)
                    {
                        const category = downloads[i].category;
                        let isUnique = true;
                        for (let k = 0; k < uniqueCategories.length; k++)
                        {
                            if (category === uniqueCategories[k])
                            {
                                isUnique = false;
                            }
                        }

                        if (isUnique)
                        {
                            uniqueCategories.push(category);
                        }
                    }

                    for (let i = 0; i < uniqueCategories.length; i++)
                    {
                        fs.mkdir(`build/assets/downloads/${ uniqueCategories[i] }`, (error) => {
                            if (error)
                            {
                                reject(error);
                            }

                            fs.mkdir(`_downloads/${ uniqueCategories[i] }`, (error) => {
                                if (error)
                                {
                                    reject(error);
                                }

                                generated++;
                                if (generated === uniqueCategories.length)
                                {
                                    resolve();
                                }
                            });
                        });
                }
                });
            });
        });
    }

    getComponentDirectories()
    {
        return new Promise((resolve, reject) => {
            glob('src/**/*/', (error, directories) => {
                if (error)
                {
                    reject(error);
                }

                resolve(directories);
            });
        });
    }

    generateNavigationFile(navigation)
    {
        return new Promise((resolve, reject) => {
            let navigationData = '{\n';
            for (let i = 0; i < navigation.length; i++)
            {
                navigationData += `\t"${ navigation[i].category }": [\n`;
                for (let k = 0; k < navigation[i].components.length; k++)
                {
                    navigationData += `\t\t"${ navigation[i].components[k] }"${ (k === (navigation[i].components.length - 1)) ? '' : ',' }\n`;
                }
                navigationData += `\t]${ (i === navigation.length - 1) ? '' : ',' }\n`;
            }
            navigationData += '}';

            fs.writeFile('build/assets/navigation.json', navigationData, (error) => {
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    buildNavigation(categories, components)
    {
        return new Promise((resolve) => {
            const navigation = [];
            for (let i = 0; i < categories.length; i++)
            {
                const newCategoryNavigation = {
                    category: categories[i],
                    components: []
                }

                for (let k = 0; k < components.length; k++)
                {
                    if (components[k].match(categories[i]))
                    {
                        let cleanName = components[k].replace(`${ categories[i] }/`, '').trim();
                        newCategoryNavigation.components.push(cleanName);
                    }
                }

                if (newCategoryNavigation.components.length > 0)
                {
                    navigation.push(newCategoryNavigation);
                }
            }

            resolve(navigation);
        });
    }

    getComponents()
    {
        return new Promise((resolve, reject) => {
            glob('src/*/*/', (error, directories) => {
                if (error)
                {
                    reject(error);
                }

                const components = [];
                for (let i = 0; i < directories.length; i++)
                {
                    let cleanName = directories[i].replace(/(\/)$/g, '').replace(/(src\/)/g, '').trim();
                    components.push(cleanName);
                }

                resolve(components);
            });
        });
    }

    getCategories()
    {
        return new Promise((resolve, reject) => {
            glob('src/*/', (error, directories) => {
                if (error)
                {
                    reject(error);
                }

                const categories = [];
                for (let i = 0; i < directories.length; i++)
                {
                    let cleanName = directories[i].replace('src/', '');
                    cleanName = cleanName.replace(/(web\_modules)|\//g, '').trim();

                    if (cleanName !== '')
                    {
                        categories.push(cleanName);
                    }
                }

                resolve(categories);
            });
        });
    }

    buildPackages(serverSafeBundleNames, timestamp)
    {
        const built = [];
        return new Promise((resolve, reject)=>{

            if (serverSafeBundleNames.length === 0)
            {
                resolve();
            }

            for (let i = 0; i < serverSafeBundleNames.length; i++)
            {
                const inputOptions = {
                    input: `_packages/${ serverSafeBundleNames[i] }.js`,
                    plugins: [
                        rollupPluginNodeResolve({
                            mainFields: ['browser', 'module', 'jsnext:main'],
                            extensions: [ '.mjs', '.js', '.json'],
                            browser: true
                        }),
                        rollupPluginCommonjs({
                            include: /node_modules/,
                            extensions: ['.cjs', '.js']
                        })
                    ]
                };
                const outputOptions = {
                    file: `build/assets/${ timestamp }/${ serverSafeBundleNames[i] }.js`,
                    format: 'iife'
                };
                this.build(inputOptions, outputOptions)
                .then(()=>{
                    built.push(serverSafeBundleNames[i]);

                    if (built.length === serverSafeBundleNames.length)
                    {
                        resolve();
                    }
                })
                .catch(err => {
                    reject(err);
                });
            }
        });
    }

    build(inputOptions, outputOptions)
    {
        return new Promise((resolve, reject)=>{
            (async ()=>{
                try
                {
                    const bundle = await rollup.rollup(inputOptions);
                    await bundle.write(outputOptions); 
                    resolve();
                }
                catch (err)
                {
                    reject(err)
                }
            })();
        });
    }

    writeBundles(dependencies)
    {
        return new Promise((resolve, reject)=>{
            
            const writtenBundles = [];

            if (dependencies.length === 0)
            {
                resolve(writtenBundles);
            }
            
            for (let i = 0; i < dependencies.length; i++)
            {
                let serverSafeName = dependencies[i].package.toLowerCase();
                serverSafeName = serverSafeName.replace(/[\/]/g, '-');
                serverSafeName = serverSafeName.replace(/\@/g, '');

                /**
                 * Example:
                 * fullPackageName = @pageworks/demo-package
                 * namespace = pageworks
                 * package = demo-package
                 * filename = pageworks-demo-package
                 */
                let fullPackageName = dependencies[i].package.toLowerCase();
                let namespace = (fullPackageName.match(/.*[\/]/)) ? fullPackageName.match(/.*[\/]/)[0].replace(/[\/\@]/g, '') : '';
                let packageName = fullPackageName.replace(/(.*?\/)/, '');

                /** Write pre-bundled bundle file */
                let data = `import ${ dependencies[i].import } from '${ fullPackageName }'\n`;
                if(dependencies[i].import.match(/(\*\sas)/))
                {
                    let importName = dependencies[i].import;
                    importName = importName.replace(/(.*\sas\s)/, '');
                    importName = importName.trim();
                    data += `\nwindow.${ importName } = ${ importName }.default;`;
                }
                else
                {
                    let importName = dependencies[i].import;
                    importName = importName.replace(/[\{\}]/g, '');
                    importName = importName.trim();
                    data += `\nwindow.${ importName } = ${ importName };`;
                }
                
                fs.writeFile(`_packages/${ serverSafeName }.js`, data, (err)=>{
                    if (err)
                    {
                        reject(err);
                    }

                    writtenBundles.push(serverSafeName);

                    if (writtenBundles.length === dependencies.length)
                    {
                        resolve(writtenBundles);
                    }
                });
            }
        });
    }

    getWebDependencies()
    {
        return new Promise((resolve)=>{
            let dependencies = [];
    
            if (projectPackage.webDependencies.length)
            {
                dependencies = projectPackage.webDependencies;
            }
            
            resolve(dependencies);
        });
    }

    makeBundleDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir('_packages', (err)=>{
                if (err)
                {
                    reject(err);
                }
        
                resolve();
            });
        });
    }

    removeBundleDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('_packages')
            .then(() => {
                fs.rmdir('_packages', { recursive: true }, (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                })
            })
            .catch(()=>{ resolve(); });
        });
    }

    injectDemoScripts(files, timestamp)
    {
        return new Promise((resolve, reject) => {
            if (files.length === 0)
            {
                resolve();
            }

            let injected = 0;
            for (let i = 0; i < files.length; i++)
            {
                const file = files[i].replace(/(\_compiled\/)|(\/demo\.js)/g, '').trim().toLowerCase();
                const categoryName = file.replace(/\/.*/g, '');
                const componentName = file.replace(/.*\//g, '');

                if (componentName)
                {
                    const scriptFilePath = `build/assets/${ timestamp }/${ (categoryName) ? categoryName + '/' : '' }${ componentName }.js`;
                    fs.promises.access(scriptFilePath)
                    .then(() => {
                        fs.readFile(scriptFilePath, (error, buffer) => {
                            if (error)
                            {
                                reject(error);
                            }

                            let scriptData = buffer.toString();
                            fs.readFile(files[i], (error, demoBuffer) => {
                                if (error)
                                {
                                    reject(error);
                                }

                                scriptData += `\n/** Demo JavaScript from ${ files[i].replace('_compiled', 'src') } */\n${ demoBuffer.toString() }`;

                                fs.writeFile(scriptFilePath, scriptData, (error) => {
                                    if (error)
                                    {
                                        reject(error);
                                    }

                                    injected++;
                                    if (injected === files.length)
                                    {
                                        resolve();
                                    }
                                });
                            });
                        });
                    })
                    .catch(() => {
                        reject(`Couldn't find file at ${ scriptFilePath }`);
                    });
                }
                else
                {
                    reject(`Failed to find component name for ${ files[i] }`);
                }
            }
        });
    }

    moveComponents(files, timestamp)
    {
        return new Promise((resolve, reject)=>{
            let moved = 0;

            if (files.length === 0)
            {
                resolve();
            }

            for (let i = 0; i < files.length; i++)
            {
                const filename = files[i].replace(/.*\//g, '');

                let categoryName = files[i].replace('_compiled/', '');
                if (categoryName.match(/\//g))
                {
                    categoryName = categoryName.match(/.*?(?=\/)/)[0];
                    
                    if (categoryName === 'web_modules')
                    {
                        categoryName = null;
                    }
                }
                else
                {
                    categoryName = null;
                }

                fs.rename(files[i], `build/assets/${ timestamp }${ (categoryName) ? '/' + categoryName : '' }/${ filename }`, (error)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    moved++;
                    if (moved === files.length)
                    {
                        resolve();
                    }
                });
            }
        });
    }

    getComponentFiles()
    {
        return new Promise((resolve, reject)=>{
            const foundFiles = {
                componentFiles: [],
                demoFiles: []
            };
            glob('_compiled/**/*.js', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                for (let i = 0; i < files.length; i++)
                {
                    if (files[i].match(/(demo\.js)$/gi))
                    {
                        foundFiles.demoFiles.push(files[i]);
                    }
                    else
                    {
                        foundFiles.componentFiles.push(files[i]);
                    }
                }

                resolve(foundFiles);
            });
        });
    }

    compileDemoSass(files, timestamp)
    {
        return new Promise((resolve, reject) => {
            let finished = 0;
            for (let i = 0; i < files.length; i++)
            {
                const file = files[i];
                let categoryName = file.replace('src/', '');
                if (categoryName.match(/\//g))
                {
                    categoryName = categoryName.match(/.*?(?=\/)/)[0];
                }
                else
                {
                    categoryName = null;
                }

                sass.render(
                    {
                        file: file,
                        outputStyle: 'compressed'
                    },
                    (error, result) => {
                        if (error)
                        {
                            reject(`\n\n${ error.message } at line ${ error.line } ${ error.file }\n\n`);
                        }

                        if (result === null)
                        {
                            return;
                        }

                        const fileName = file.replace('/demo.scss', '').replace(/.*\//g, '').trim().toLowerCase();
                        if (fileName)
                        {
                            const compiledCssFilePath = `build/assets/${ timestamp }${ (categoryName) ? '/' + categoryName : '' }/${ fileName }.css`;

                            fs.promises.access(compiledCssFilePath)
                            .then(() => {
                                
                                fs.readFile(compiledCssFilePath, (error, buffer) => {
                                    if (error)
                                    {
                                        reject(error);
                                    }

                                    let compiledCssData = buffer.toString();
                                    compiledCssData += `\n/** ${ file }  */\n${ result.css.toString() }`;

                                    fs.writeFile(compiledCssFilePath, compiledCssData, (error)=>{
                                        if (error)
                                        {
                                            reject('Something went wrong saving the file' + error);
                                        }
    
                                        console.log(`${ compiledCssFilePath } [updated]`);
                                        finished++;
                                        if (finished === files.length)
                                        {
                                            resolve();
                                        }
                                    });

                                });
                            })
                            .catch(() => {
                                reject(`Compiled SASS file ${ fileName } is missing at ${ compiledCssFilePath }`);
                            });
                        }
                        else
                        {
                            reject('Something went wrong with the file name of ' + result.stats.entry);
                        }
                    }
                );
            }
        });
    }

    compileSass(files, timestamp)
    {
        return new Promise((resolve, reject)=>{
            let compiled = 0;

            for (let i = 0; i < files.length; i++)
            {
                const file = files[i];
                let categoryName = file.replace('src/', '');
                if (categoryName.match(/\//g))
                {
                    categoryName = categoryName.match(/.*?(?=\/)/)[0];
                }
                else
                {
                    categoryName = null;
                }

                sass.render(
                    {
                        file: file,
                        outputStyle: 'compressed'
                    },
                    (error, result) => {
                        if (error)
                        {
                            reject(`\n\n${ error.message } at line ${ error.line } ${ error.file }\n\n`);
                        }

                        if (result === null)
                        {
                            return;
                        }

                        let fileName = result.stats.entry.replace(/.*\//g, '').toLowerCase();
                        fileName = fileName.replace(/(.scss)|(.sass)/g, '').trim();

                        if (fileName)
                        {
                            const compiledCssFilePath = `build/assets/${ timestamp }${ (categoryName) ? '/' + categoryName : '' }/${ fileName }.css`;
                            let compiledCssData = `/** ${ file }  */\n${ result.css.toString() }`;

                            fs.writeFile(compiledCssFilePath, compiledCssData, (error)=>{
                                if (error)
                                {
                                    reject('Something went wrong saving the file' + error);
                                }

                                console.log(`${ compiledCssFilePath } [compiled]`);
                                compiled++;

                                if (compiled === files.length)
                                {
                                    resolve();
                                }
                            });
                        }
                        else
                        {
                            reject('Something went wrong with the file name of ' + result.stats.entry);
                        }
                    }
                );
            }
        });
    }

    buildCategoryDirectories(timestamp)
    {
        return new Promise((resolve, reject) => {
            glob('src/*/', (error, directories) => {
                if (error)
                {
                    reject(error);
                }

                let built = 0;
                for (let i = 0; i < directories.length; i++)
                {
                    const directory = directories[i];
                    let categoryName = directory.replace(/(src)|(\/)/g, '').trim();
                    if (categoryName === 'web_modules')
                    {
                        categoryName = null;
                        built++;
                        if (built === directories.length)
                        {
                            resolve();
                        }
                    }

                    if (categoryName)
                    {
                        fs.mkdir(`build/assets/${ timestamp }/${ categoryName }`, (error) => {
                            if (error)
                            {
                                reject(error);
                            }

                            built++;
                            if (built === directories.length)
                            {
                                resolve();
                            }
                        });
                    }
                }
            });
        });
    }

    splitSassFiles(files)
    {
        return new Promise((resolve) => {
            const response = {
                verifiedFiles: [],
                demoFiles: []
            };

            for (let i = 0; i < files.length; i++)
            {
                if (files[i].match(/(demo\.scss)$/gi))
                {
                    response.demoFiles.push(files[i]);
                }
                else
                {
                    response.verifiedFiles.push(files[i]);
                }
            }

            resolve(response);
        });
    }

    getSassFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('src/**/*.scss', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    injectDemoHtmlFiles(htmlFiles)
    {
        return new Promise((resolve, reject) => {
            if (htmlFiles.length === 0)
            {
                resolve();
            }

            let injected = 0;
            for (let i = 0; i < htmlFiles.length; i++)
            {
                const file = htmlFiles[i];
                let categoryName = file.replace('src/', '');
                if (categoryName.match(/\//g))
                {
                    categoryName = categoryName.match(/.*?(?=\/)/)[0];
                }
                else
                {
                    categoryName = null;
                }

                const componentName = file.replace('/demo.html', '').replace(/.*\//g, '').trim().toLowerCase();
                if (componentName)
                {
                    const htmlFilePath = `build/${ (categoryName) ? categoryName + '/' : '' }${ componentName }/index.html`;

                    fs.promises.access(htmlFilePath)
                    .then(() => {
                        fs.readFile(htmlFilePath, (error, buffer) => {
                            if (error)
                            {
                                reject(error);
                            }

                            let htmlData = buffer.toString();
                            fs.readFile(file, (error, demoBuffer) => {
                                if (error)
                                {
                                    reject(error);
                                }

                                htmlData = htmlData.replace('<!-- Demo HTML -->', demoBuffer.toString());
                                fs.writeFile(htmlFilePath, htmlData, (error)=>{
                                    if (error)
                                    {
                                        reject('Something went wrong saving the file' + error);
                                    }
    
                                    injected++;
                                    if (injected === htmlFiles.length)
                                    {
                                        resolve();
                                    }
                                });
                            });
                        });
                    })
                    .catch(() => {
                        reject(`${ componentName } is missing at ${ htmlFilePath }`);
                    });
                }
                else
                {
                    reject(`Something went wrong with the file name of ${ componentName }`);
                }
            }
        });
    }

    updateHtmlFiles(htmlFiles, timestamp)
    {
        return new Promise((resolve, reject)=>{
            if (htmlFiles.length === 0)
            {
                resolve();
            }
            
            fs.readFile('src/shell.html', (error, buffer)=>{
                if (error)
                {
                    reject(error);
                }

                let moved = 0;
                for (let i = 0; i < htmlFiles.length; i++)
                {
                    fs.readFile(htmlFiles[i], (error, htmlBuffer)=>{
                        if (error)
                        {
                            reject(error);
                        }
                        
                        const htmlSnippet = htmlBuffer.toString();
                        let data = buffer.toString();
                        data = data.replace('REPLACE_WITH_HTML', htmlSnippet);
                        data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                        const htmlPath = htmlFiles[i].replace('src/', 'build/').match(/.*\//g)[0].replace(/[\/]$/g, '').trim();

                        fs.promises.mkdir(htmlPath, { recursive: true })
                        .then(()=>{
                            fs.writeFile(`${ htmlPath }/index.html`, data, (error)=>{
                                if (error)
                                {
                                    reject(error);
                                }
    
                                moved++;
    
                                if (moved === htmlFiles.length)
                                {
                                    resolve();
                                }
                            });
                        })
                        .catch(error => reject(error));
                    });
                }
            });
        });
    }

    updateHomepageHtml(homepageHtmlFilePath, timestamp)
    {
        return new Promise((resolve, reject)=>{
            fs.readFile('src/shell.html', (error, buffer)=>{
                if (error)
                {
                    reject(error);
                }

                let data = buffer.toString();
                
                fs.readFile(homepageHtmlFilePath, (error, buffer)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    const homepageData = buffer.toString();

                    data = data.replace('REPLACE_WITH_HTML', homepageData);
                    data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                    fs.writeFile('build/index.html', data, (error)=>{
                        if (error)
                        {
                            reject(error);
                        }

                        resolve();
                    });
                });
            });
        });
    }

    updateCachebustTimestamp(timestamp, files)
    {
        return new Promise((resolve, reject)=>{
            let updated = 0;
            for (let i = 0; i < files.length; i++)
            {
                fs.readFile(files[i], (error, buffer)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    let data = buffer.toString();
                    data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                    fs.writeFile(files[i], data, (error)=>{
                        if (error)
                        {
                            reject(error);
                        }

                        updated++;

                        if (updated === files.length)
                        {
                            resolve();
                        }
                    });
                });
            }
        });
    }

    getHomepageHtmlFile()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('src/homepage.html')
            .then(()=>{
                resolve('src/homepage.html');
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    getDemoHtmlFiles()
    {
        return new Promise((resolve, reject) => {
            glob('src/**/demo.html', (error, files) => {
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    getHtmlFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('src/**/index.html', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    createCachebustDirectory(timestamp)
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir(`build/assets/${ timestamp }`, (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    createAssetsDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir('build/assets', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    createBuildDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('build')
            .then(() => { resolve(); })
            .catch(() => {
                fs.mkdir('build', (error)=>{
                    if (error)
                    {
                        reject(error);
                    }
    
                    resolve();
                });
            });
        });
    }

    removeAssetsDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('build/assets')
            .then(() => {
                fs.rmdir('build/assets', { recursive: true }, (error)=>{
                    if (error)
                    {
                        reject(error);
                    }
    
                    resolve();
                });
            })
            .catch(() => {
                resolve();
            });
        });
    }

    moveWorker()
    {
        return new Promise((resolve, reject)=>{
            fs.rename('_compiled/worker.js', 'build/worker.js', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    moveApplication()
    {
        return new Promise((resolve, reject)=>{
            fs.rename('_compiled/application.js', 'build/assets/application.js', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }
}

new Compiler();