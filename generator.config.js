const clear = require('clear');
const inquirer = require('inquirer');
const fs = require('fs');
const glob = require('glob');

class Generator
{
    constructor()
    {
        this.run();
    }
    
    async run()
    {
        try
        {
            clear();
            let type = await this.getType();
            type = type.type;
            let name = await this.getName();
            name = await this.cleanupName(name.name);
            const kebabName = await this.getKebabName(name);
            const pascalName = await this.getPascalName(name);

            switch (type)
            {
                case 'Category':
                    await this.createNewCategory(kebabName);
                    break;
                case 'Component':
                    const categories = await this.getCategories();
                    let category = await this.getCategory(categories);
                    category = category.category;
                    await this.createNewComponent(kebabName, pascalName, category);
                    break;
            }

            console.log(`${ type } was successfully created!`);
        }
        catch (error)
        {
            console.log(error);
        }
    }

    createNewComponent(kebabName, pascalName, category)
    {
        return new Promise((resolve, reject) => {
            fs.promises.access(`src/${ category }/${ kebabName }`)
            .then(() => {
                reject(`The ${ kebabName } component already exists at ${ category }`);
            })
            .catch(() => {
                fs.mkdir(`src/${ category }/${ kebabName }`, (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    const htmlData = `<script type="module">\n\tstylesheets = [...stylesheets, '${ category }/${ kebabName }'];\n</script>\n<script type="module">\n\tcomponents = [...components, '${ category }/${ kebabName }'];\n</script>\n\n<${ kebabName }>${ kebabName }</${ kebabName }>`;
                    fs.writeFile(`src/${ category }/${ kebabName }/index.html`, htmlData, (error) => {
                        if (error)
                        {
                            reject(error);
                        }

                        const sassData = `${ kebabName }\n{\n\tdisplay: inline-block;\n}`;
                        fs.writeFile(`src/${ category }/${ kebabName }/${ kebabName }.scss`, sassData, (error) => {
                            if (error)
                            {
                                reject(error);
                            }

                            const scriptData = `class ${ pascalName } extends HTMLElement\n{\n\tconnectedCallback()\n\t{\n\t\tconsole.log('${ kebabName } component has been connected.');\n\t}\n}\n\ncustomElements.define('${ kebabName }', ${ pascalName });\n`;
                            fs.writeFile(`src/${ category }/${ kebabName }/${ kebabName }.ts`, scriptData, (error) => {
                                if (error)
                                {
                                    reject(error);
                                }

                                const readmeData = `# ${ kebabName.replace(/\-/g, ' ') } component\n\nA basic description of the web component.\n`;
                                fs.writeFile(`src/${ category }/${ kebabName }/readme.md`, readmeData, (error) => {
                                    if (error)
                                    {
                                        reject(error);
                                    }

                                    const today = new Date();
                                    const changelogData = `## ${ today.getFullYear() }-${ today.getMonth() }-${ today.getDay() }\n\n### Added\n\n- Adds: ${ kebabName.replace(/\-/g, ' ') } component\n`;
                                    fs.writeFile(`src/${ category }/${ kebabName }/changelog.md`, changelogData, (error) => {
                                        if (error)
                                        {
                                            reject(error);
                                        }

                                        const dataModelData = `{\n\t"sample": "hello world"\n}`;
                                        fs.writeFile(`src/${ category }/${ kebabName }/data.json`, dataModelData, (error) => {
                                            if (error)
                                            {
                                                reject(error);
                                            }

                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    createNewCategory(name)
    {
        return new Promise((resolve, reject) => {
            fs.promises.access(`src/${ name }`)
            .then(() => {
                reject(`src/${ name } already exists`);
            })
            .catch(() => {
                fs.mkdir(`src/${ name }`, (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                });
            });
        });
    }

    getCategory(categories)
    {
        const questions = [
            {
                name: 'category',
                type: 'list',
                message: 'Select a category for the new component:',
                choices: categories
            },
        ];

        return inquirer.prompt(questions);
    }

    getCategories()
    {
        return new Promise((resolve, reject) => {
            const categories = [];
            glob('src/*/', (error, matches) => {
                if (error)
                {
                    reject(error);
                }

                for (let i = 0; i < matches.length; i++)
                {
                    let cleanCategoryName = matches[i].replace('src/', '').replace('/', '').trim();
                    cleanCategoryName = cleanCategoryName.replace(/(web\_modules)/gi, '');

                    if (cleanCategoryName !== '')
                    {
                        categories.push(cleanCategoryName);
                    }
                }

                if (categories.length > 0)
                {
                    resolve(categories);
                }
                else
                {
                    reject('Please create a category before creating a new component.');
                }
            });
        });
    }

    getPascalName(name)
    {
        return new Promise((resolve) => {
            const pascalName = `${ name }`
            .replace(new RegExp(/[-_]+/, 'g'), ' ')
            .replace(new RegExp(/[^\w\s]/, 'g'), '')
            .replace(
                new RegExp(/\s+(.)(\w+)/, 'g'),
                ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
            )
            .replace(new RegExp(/\s/, 'g'), '')
            .replace(new RegExp(/\w/), s => s.toUpperCase());

            resolve(pascalName);
        });
    }

    getKebabName(name)
    {
        return new Promise((resolve) => {
            const kebabName = name.replace(/\s/g, '-');
            resolve(kebabName);
        });
    }
    
    cleanupName(input)
    {
        return new Promise((resolve) => {
            const cleanInput = input.replace(/[\-\.\_]/g, ' ').toLowerCase().trim();
            resolve(cleanInput);
        });
    }

    getName()
    {
        const questions = [
            {
                name: 'name',
                type: 'input',
                message: 'Name',
                validate: (input)=>{
                    if(input === ''){
                        return 'A name is required.';
                    }
                    else{
                        return true;
                    }
                }
            },
        ];

        return inquirer.prompt(questions);
    }

    getType()
    {
        const questions = [
            {
                name: 'type',
                type: 'list',
                message: 'What are you creating?',
                choices: [
                    'Component',
                    'Category',
                ]
            },
        ];

        return inquirer.prompt(questions);
    }
}

new Generator();