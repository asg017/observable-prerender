# observable-prerender

Pre-render Observable notebooks with Puppeteer! Inspired by [d3-pre](https://github.com/fivethirtyeight/d3-pre)

## Why tho

Observable notebooks run in the browser and use browser APIs, like SVG, canvas, webgl, and so much more. Sometimes, you may want to script or automate Observable notebooks in some way. For example, you may want to:

- Create a bar chart with custom data
- Generate a SVG map for every county in California
- Render frames for a MP4 screencast of a custom animation

If you wanted to do this before, you'd have to manually open a browser, re-write code, upload different file attachments, download cells, and repeat it all many times. Now you can script it all!

## Examples

Check out `examples/` for workable code.

### Create a bar chart with your own data

```javascript
const { load } = require("@alex.garcia/observable-prerender");
(async () => {
  const notebook = await load("@d3/bar-chart", ["chart", "data"]);
  const data = [
    { name: "alex", value: 20 },
    { name: "brian", value: 30 },
    { name: "craig", value: 10 },
  ];
  await notebook.redefine("data", data);
  await notebook.screenshot("chart", "bar-chart.png");
  await notebook.browser.close();
})();
```

Result:
<img alt="Screenshot of a bar chart with 3 bars, with labels alex, brian and craig, with values 20, 30, and 10, respectively." src="https://user-images.githubusercontent.com/15178711/86563267-ee847580-bf18-11ea-9b58-8c5ee6d710f4.png" width="500">

### Create a map of every county in California

```javascript
const { load } = require("@alex.garcia/observable-prerender");
(async () => {
  const notebook = await load(
    "@datadesk/base-maps-for-all-58-california-counties",
    ["chart"]
  );
  const counties = await notebook.value("counties");
  for await (let county of counties) {
    await notebook.redefine("county", county.fips);
    await notebook.screenshot("chart", `${county.name}.png`);
    await notebook.svg("chart", `${county.name}.svg`);
  }
  await notebook.browser.close();
})();
```

Some of the resulting PNGs:

| -                                                                                                                                                                                  | -                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img alt="Picture of a simple map of Los Angeles county." src="https://user-images.githubusercontent.com/15178711/86563356-15db4280-bf19-11ea-86e2-664c64a1593a.png" width="400"/> | <img alt="Picture of a simple map of Merced county." src="https://user-images.githubusercontent.com/15178711/86563375-1e337d80-bf19-11ea-9bc9-03517bb82bab.png" width="400">     |
| <img alt="Picture of a simple map of Sacramento county." src="https://user-images.githubusercontent.com/15178711/86563392-25f32200-bf19-11ea-9c96-54e394012585.png" width="400">   | <img alt="Picture of a simple map of San Diegoo county." src="https://user-images.githubusercontent.com/15178711/86563413-2ee3f380-bf19-11ea-87c3-5fd08ad0861d.png" width="400"> |

### Create frames for an animated GIF

Create PNG frames with `observable-prerender`:

```javascript
const { load } = require("@alex.garcia/observable-prerender");
(async () => {
  const notebook = await load("@asg017/sunrise-and-sunset-worldwide", [
    "graphic",
    "controller",
  ]);
  const times = await notebook.value("times");
  for (let i = 0; i < times.length; i++) {
    await notebook.redefine("timeI", i);
    await notebook.waitFor("controller");
    await notebook.screenshot("graphic", `sun${i}.png`);
  }
  await notebook.browser.close();
})();
```

Then use something like ffmpeg to create a MP4 video with those frames!

```bash
 ffmpeg.exe -framerate 30 -i sun%03d.png -c:v libx264  -pix_fmt yuv420p out.mp4
```

Result (as a GIF, since GitHub only supports gifs):

<img alt="Screencast of a animation of sunlight time in Los Angeles during the year." src="https://user-images.githubusercontent.com/15178711/86563817-ed077d00-bf19-11ea-9922-52ef0fd5c38d.gif" width="500"/>

### Working with `puppeteer-cluster`

You can pass in raw Puppeteer `browser`/`page` objects into `load()`, which works really well with 3rd party Puppeteer tools like `puppeteer-cluster`. Here's an example where we have a cluster of Puppeteer workers that take screenshots of the `chart` cells of various D3 examples:

```js
const { Cluster } = require("puppeteer-cluster");
const { load } = require("@alex.garcia/observable-prerender");

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  await cluster.task(async ({ page, data: notebookId }) => {
    const notebook = await load(notebookId, ["chart"], { page });
    await notebook.screenshot("chart", `${notebookId}.png`.replace("/", "_"));
  });

  cluster.queue("@d3/bar-chart");
  cluster.queue("@d3/line-chart");
  cluster.queue("@d3/directed-chord-diagram");
  cluster.queue("@d3/spike-map");
  cluster.queue("@d3/fan-chart");

  await cluster.idle();
  await cluster.close();
})();
```

### The `observable-prerender` CLI

Check out the `/cli-examples` directory for bash scripts that show off the different arguments of the bundled CLI programs.

## Install

```bash
npm install @alex.garcia/observable-prerender
```

## API Reference

Although not required, a solid understanding of the Observable notebook runtime and the embedding process could help greatly when building with this tool. Here's some resources you could use to learn more:

- [How Observable Runs from Observable](https://observablehq.com/@observablehq/how-observable-runs)
- [Downloading and Embedding Notebooks from Observable](https://observablehq.com/@observablehq/downloading-and-embedding-notebooks)

### prerender.**load**(notebook, _targets_, _config_)

Load the given notebook into a page in a browser.

- `notebook` <[string]> ID of the notebook on observablehq.com, like `@d3/bar-chart` or `@asg017/bitmoji`. For unlisted notebooks, be sure to include the `d/` prefix (e.g. `d/27a0b05d777304bd`).
- `targets` <[Array]<[string]>> array of cell names that will be evaluated. Every cell in `targets` (and the cells they depend on) will be evaluated and render to the page's DOM. If not supplied, then all cells (including anonymous ones) will be evaluated by default.

- `config` is an object with key/values for more control over how to load the notebook.

| Key                    | Value                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `browser`              | Supply a Puppeteer Browser object instead of creating a new one. Good for `headless:false` debugging.                                                                                                                                                                          |
| `page`                 | Supply a Puppeteer Page object instead of creating a new browser or page. Good for use in something like [`puppeteer-cluster`](https://github.com/thomasdondorf/puppeteer-cluster)                                                                                             |
| `OBSERVABLEHQ_API_KEY` | Supply an [ObservableHQ API Key](https://observablehq.com/@observablehq/api-keys) to load in private notebooks. NOTE: This library uses the api_key URL query parameter to supply the key to Observable, which according to their guide, is meant for testing and development. |
| `height`               | Number, height of the Puppeteer browser that will be created. If `browser` is also passed, this will be ignored. Default `675`.                                                                                                                                                |
| `width`                | Number, idth of the Puppeteer browser that will be created. If `browser` is also passed, this will be ignored. Default `1200`.                                                                                                                                                 |
| `headless`             | Boolean, whether the Puppeteer browser should be "headless" or not. great for debugging. Default `true`.                                                                                                                                                                       |

`.load()` returns a Notebook object. A Notebook has `page` and `browser` properties, which are the Puppeteer page and browser objects that the notebook is loaded with. This gives a lower-level API to the underlying Puppeteer objects that render the notebook, in case you want more fine-grain API access for more control.

### notebook.**value**(cell)

Returns a Promise that resolves value of the given cell for the book. For example, if the `@d3/bar-chart` notebook is loaded, then `.value("color")` would return `"steelblue"`, `.value("height")` would return `500`, and `.value("data)` would return the 26-length JS array containing the data.

Keep in mind that the value return is serialized from the browser to Node, see below for details.

### notebook.**redefine**(cell, value)

Redefine a specific cell in the Notebook runtime to a new value. `cell` is the name of the cell that will be redefined, and `value` is the value that cell will be redefined as. If `cell` is an object, then all of the object's keys/values will be redefined on the notebook (e.g. `cell={a:1, b:2}` would redefine cell `a` to `1` and `b` to `2`).

Keep in mind that the value return is serialized from the browser to Node, see below for details.

### notebook.**screenshot**(cell, path, _options_)

Take a screenshot of the container of the element that contains the rendered value of `cell`. `path` is the path of the saved screenshot (PNG), and `options` is any extra options that get added to the underlying Puppeteer `.screenshot()` function ([list of options here](https://pptr.dev/#?product=Puppeteer&version=v5.0.0&show=api-pagescreenshotoptions)). For example, if the `@d3/bar-chart` notebook is loaded, `notebook.screenshot('chart')`

### notebook.**svg**(cell, path)

If `cell` is a SVG cell, this will save that cell's SVG into `path`, like `.screenshot()`. Keep in mind, the browser's CSS won't be exported into the SVG, so beware of styling with `class`.

### notebook.**pdf**(path, _options_)

Use Puppeteer's [`.pdf()`](https://pptr.dev/#?product=Puppeteer&version=v5.3.1&show=api-pagepdfoptions) function to render the entire page as a PDF. `path` is the path of the PDF to save to, `options` will be passed into Puppeteer's `.pdf()` function. This will wait for all the cells in the notebook to be fulfilled. Note, this can't be used on a non-headless browser.

### notebook.**waitFor**(cell, _status_)

Returns a Promise that resolves when the cell named `cell` is `"fulfilled"` (see the Observable inspector documentation for more details). The default is fulfilled, but `status` could also be `"pending"` or `"rejected"`. Use this function to ensure that youre redefined changes propagate to dependent cells. If no parameters are passed in, then the Promise will wait all the cells, including un-named ones, to finish executing.

### notebook.**fileAttachments**(files)

Replace the [FileAttachments](https://observablehq.com/@observablehq/file-attachments) of the notebook with those defined in `files`. `files` is an object where the keys are the names of the FileAttachment, and the values are the absolute paths to the files that will replace the FileAttachments.

## CLI Reference

`observable-prerender` also comes bundled with 2 CLI programs, `observable-prerender` and `observable-prerender-animate`, that allow you to more quickly pre-render notebooks and integrate with local files and other CLI tools.

### `observable-prerender [options] <notebook> [cells...]`

Pre-render the given notebook and take screenshots of the given cells. `<notebook>` is the observablehq.com ID of the notebook to load, same argument as the 1st argument in `.load()`. `[cells...]` is the list of cells that will be screenshotted from the notebook. By default, the screenshots will be saved as `<cell_name>.<format>` in the current directory.

Run `observable-prerender --help` to get a full list of options.

### `observable-prerender-animate [options] <notebook> [cells...] --iter cell:cellIterator`

Pre-render the given notebook, iterate through the values of the `cellIterator` cell on the `cell` cell, and take screenshots of the argument cells. `<notebook>` is the observablehq.com ID of the notebook to load, same argument as the 1st argument in `.load()`. `[cells...]` is the list of cells that will be screenshotted from the notebook. `--iter` is the only required option, in the format of `cell:cellIterator`, where `cell` is the cell that will change on every loop, and `cellIterator` will be the cell that contains all the values.

Run `observable-prerender-animate --help` to get a full list of options.

## Caveats

### Beta

This library is mostly a proof of concept, and probably will change in the future. Follow Issue #2 to know when the stable v1 library will be complete. As always, feedback, bug reports, and ideas will make v1 even better!

### Serialization

There is a Puppeteer serialization process when switching from browser JS data to Node. Returning primitives like arrays, plain JS objects, numbers, and strings will work fine, but custom objects, HTML elements, Date objects, and some typed arrays may not. Which means that some methods like `.value()` or `.redefine()` may be limited or may not work as expected, causing subtle bugs. Check out the [Puppeteer docs](https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-pageevaluatepagefunction-args) for more info about this.

### Animation is hard

You won't be able to make neat screencasts from all Observable notebooks. Puppeteer doesn't support taking a video recording of a browser, so instead, the suggested method is to take several PNG screenshots, then stitch them all together into a gif/mp4 using ffmpeg or some other service.

So what should you screenshot, exactly? It depends on your notebook. You probably need to have some counter/index/pointer that changes the graph when updated (see [scrubber](https://observablehq.com/@mbostock/scrubber)). You can programmatically redefine that cell using `notebook.redefine` in some loop, then screenshot the graph once the changes propagate (`notebook.waitFor`). But keep in mind, this may work for JS transitions, but CSS animations may not render properly or in time, so it really depends on how you built your notebook. it's super hard to get it right without some real digging.

If you run into any issues getting frames for a animation, feel free to open an issue!

## "Benchmarking"

In this project, "Benchmarking" can refer to three different things: the `op-benchmark` CLI tool, internal benchmarks for the package, and external benchmarks for comparing against other embedding options.

### `op-benchmark` for Benchmarking Notebooks

`op-benchmark` is a CLI tool bundled with `observable-prerender` that measures how long every cell's execution time for a given notebook. It's meant to be used by anyone to test their own notebooks, and is part of the `observable-prerender` suite of tools.

### Internal Benchmarking

`/benchmark-internal` is a series of tests performed against `observable-prerender` to ensure `observable-prerender` runs as fast as possible, and that new changes to drastically effect the performace of the tool. This is meant to be used by `observable-prerender` developers, not by users of the `observable-prerender` tool.

#### External Benchmarking

`/benchmark-external` contains serveral tests to compare `observable-prerender` with other Observable notebook embeding options. A common use-case for `observable-prerender` is to pre-render Observable notebooks for faster performance for end users, so these tests are to ensure and measure how much faster `observable-prerender` actually is. This is meant for `observable-prerender` developers, not for general users.
