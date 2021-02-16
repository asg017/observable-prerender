const { load } = require("../src");
const { writeFileSync, mkdirSync, readFileSync } = require("fs");
const { join } = require("path");
const puppeteer = require("puppeteer");
const SVGO = require("svgo");

const svgo = new SVGO();

async function main() {
  const browser = await puppeteer.launch();

  const outDir = join(__dirname, "out-pages");
  mkdirSync(outDir);

  const notebooks = [
    { notebook: "@mbostock/u-s-airports-voronoi", cell: "chart" },
    { notebook: "@d3/bar-chart", cell: "chart" },
    { notebook: "@d3/bivariate-choropleth", cell: "chart" },
    { notebook: "@asg017/covid19-cases-in-whittier-california", cell: "chart" },
    { notebook: "@asg017/watercolor-fork", cell: "chart" },
    { notebook: "@d3/world-airports", cell: "map" },
    { notebook: "@d3/countries-by-area", cell: "chart" },
    {
      notebook: "@chicagoreporter/coronavirus-illinois-historical",
      cell: "IllinoisCumulativeCovidChartEN",
    },
    { notebook: "@mizzou-journalism/general-2020-ap-feed", cell: "govChart" },
    {
      notebook: "@lathropd/indian-country-today-nativevote2020",
      cell: "allCategory",
    },
    { notebook: "@aimywang/presentvz", cell: "map" },
    { notebook: "@darcyconnect/the-wealth-health-of-nations/2", cell: "chart" },
    {
      notebook: "@rdmurphy/actblue-ticker-tracker",
      cell: "chart",
    },
    {
      notebook:
        "@mattstiles/mapping-donations-to-candidates-in-the-race-for-2nd-distric",
      cell: "chart960",
    },
    {
      notebook: "@datadesk/earthquake-intensity-map",
      cell: "map",
    },
    {
      notebook: "@datadesk/black-and-latino-u-s-population-shares",
      cell: "chart",
    },
    { notebook: "@d3/hexbin-map", cell: "chart" },
    { notebook: "@mbostock/star-map", cell: "map" },
  ];

  for (const { notebook, cell } of notebooks) {
    console.log(notebook, cell);
    const folderName = notebook.replace(/[@\/]/g, "");
    const workingDir = join(outDir, folderName);
    mkdirSync(workingDir);

    const nb = await load(notebook, [cell], { browser });
    await nb.svg(cell, join(workingDir, `${cell}.svg`));

    // embeding iframe
    writeFileSync(
      join(workingDir, "embed-iframe.html"),
      `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="Description"
        content="Testing speed of different Observable notebook embeding approaches."
      />
      <title>Embed Iframe Example</title>
    </head>
    <body>
      <h1>Embed Example</h1>
      <p>Yahoo!</p>
      <iframe
        width="100%"
        height="681"
        frameborder="0"
        src="https://observablehq.com/embed/${notebook}?cells=${cell}"
      ></iframe>
    </body>
  </html>
  `
    );

    // embeding w/ js
    writeFileSync(
      join(workingDir, "embed-js.html"),
      `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="Description"
        content="Testing speed of different Observable notebook embeding approaches."
      />
      <title>SVG Embed Example</title>
    </head>
    <body>
      <h1>Embed Example</h1>
      <p>Yahoo!</p>
      <div id="observablehq-1ea4be8f"></div>
      <script type="module">
        import {
          Runtime,
          Inspector,
        } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
        import define from "https://api.observablehq.com/${notebook}.js?v=3";
        const inspect = Inspector.into("#observablehq-1ea4be8f");
        new Runtime().module(define, (name) =>
          name === "${cell}" ? inspect() : undefined
        );
      </script>
    </body>
  </html>
  `
    );

    // prerendered basic
    writeFileSync(
      join(workingDir, "prerendered.html"),
      `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="Description" content="Testing speed of different Observable notebook embeding approaches.">
            <title>SVG Embed Example</title>
          </head>
          <body>
            <h1>Pre-rendered Example</h1>
            <p>Yahoo!</p>
            <div>
              <object type="image/svg+xml" data="${cell}.svg"></object>
            </div>
            </script>
          </body>
        </html>
        `
    );

    // prerendered-optimized
    writeFileSync(
      join(workingDir, `${cell}-optimized.svg`),
      (await svgo.optimize(readFileSync(join(workingDir, `${cell}.svg`)))).data
    );
    writeFileSync(
      join(workingDir, "prerendered-optimized.html"),
      `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta name="Description" content="Testing speed of different Observable notebook embeding approaches.">
              <title>SVG Embed Example</title>
            </head>
            <body>
              <h1>Pre-rendered Optimized Example</h1>
              <p>Yahoo!</p>
              <div>
                <object type="image/svg+xml" data="${cell}-optimized.svg"></object>
              </div>
              </script>
            </body>
          </html>
          `
    );
  }

  await browser.close();
  process.exit(0);
}

main();
