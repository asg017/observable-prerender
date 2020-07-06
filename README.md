# prerender-observable

Pre-render Observable Notebooks with Puppeteer!

## Why tho

Observable notebooks run in the browser, and use browser APIs, like SVG, canvas, webgl, and so much more. Sometimes, you may want to script or automate Observable notebooks in some way. For example, creating an SVG map forevery county in California, or create a bar chart with different data. If you wanted to do this before, you'd have to manually open a browser, re-write code or upload different file attachments, download the chart, and repeat many times. Now, you can script it, all with puppeteer!

## Install

## Usage

Although not required, a solid understanding of the Observable notebook runtime and the embedding process could help greatly when building with this tool. Here's some resources you could use to learn more:

- [How Observable Runs from Observable](https://observablehq.com/@observablehq/how-observable-runs)
- [Downloading and Embedding Notebooks from Observable](https://observablehq.com/@observablehq/downloading-and-embedding-notebooks)

`prerender-observable` will embed notebook into a custom webpage on a chromium browser, using Puppeteer. The custom webpage is a normal HTML file that dynamically imports specified Observable notebooks, and offers a lightweight interface for manipulation or screnshotting the rendered output.

## API Reference

### prerender.**load**(notebook, _targets_)

Load the given notebook into a page in a browser. `notebook` is the id of the notebook on observablehq.com, like `@d3/bar-chart` or `@asg017/bitmoji`. For public notebooks, be sure to include the `d/` prefix (e.g. `d/27a0b05d777304bd`). `targets` is an array of cell names that will be evaluated. Every cell in `targets` (and the cells they depend on) will be evaluated and render to the page's DOM. If not supplied, then all cells (including anonymous ones) will be evaluated by default.

This returns a Notebook object. A Notebook has `page` and `browser` properties, which are the Puppeteer page and browser objects that the notebook is loaded with. This gives a lower-level API to the loaded notebook.

### notebook.**value**(cell)

Returns the value of the given cell for the book. For example, if the `@d3/bar-chart` notebook is loaded, then `.value("color")` would return `"steelblue"`, `.value("height")` would return `500`, and `.value("data)` would return the 26-length JS array containing the data.

Keep in mind that the value return is serialized from the browser to Node, see below for details.

### notebook.**redefine**(cell, value)

Redefine a specific cell in the Notebook runtime to a new value. `cell` is the name of the cell that will be redefined, and `value` is the value that cell will be redefined as.

Keep in mind that the value return is serialized from the browser to Node, see below for details.

### notebook.**screenshot**(cell, path)

Take a screenshot of the container of the i

### notebook.**svg**(cell)

### notebook.**waitFor**(cell)

## A Note on Serialization

there is a Puppeteer serialization process when switching from browser JS data to Node. Returning primitives like arrays, plain JS objects, numbers, and strings will work fine, but custom objects, HTML elements, Date objects, and some typed arrays may not. Which means that some methods like `.value()` or `.redefine()` may be limited or may not work as expected, causing subtle bugs. Check out the [Puppeteer docs](https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-pageevaluatepagefunction-args) for more info about this.

## Internal
