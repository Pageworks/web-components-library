# Web Components Library

Browse, demo, and download prebuilt web components based around the Atomic Design methodology.

## Requirements

- [Nodejs >= 12.10.0](https://nodejs.org/en/)

## Project Setup

```sh
# Install NPM packages
npm ci

# Build the project
npm run compile
```

## Usage

```sh
# Compile the source code
npm run compile

# Compile the source code and start an HTTP server
npm run build

# Start an HTTP server
npm run preview
```

## Adding Categories

To create new category run the following command in your terminal:

```sh
npm run create
```

Then select the **Category** option from the list.

## Adding Web Components

To create new web component run the following command in your terminal:

```sh
npm run create
```

Then select the **Component** option from the list. Enter a short but descriptive name for you new component before selecting what category the component should be generated in. If the component doesn't seem to fit into any of the listed categories terminate the generator and create the new category first.

Navigate into the `src/` directory and locate your new component. You'll notice that some default files will be generated for you, feel free to change them or remove them depending on your components needs.

If you need custom HTML, CSS, or JavaScript that will only appear in the demo viewer and now in the source code feel free to add the following files to the components directory:

- `demo.scss`
- `demo.html`
- `demo.ts`

If these files are available when the compiler runs they will be injected into the compiled files.
