const puppeteer = require("puppeteer");
const path = require("path");
const rw = require("rw").dash;

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = Math.floor((DEFAULT_WIDTH * 9) / 16);

function serializeCellName(cell) {
  return cell.replace(/ /g, "_");
}

const htmlPage = rw.readFileSync(
  path.join(__dirname, "content", "index.html"),
  "utf8"
);

class ObservablePrerenderError extends Error {
  constructor(message, data, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ObservablePrerenderError);
    }

    this.message = message;
    this.data = data;
  }
}

class Notebook {
  constructor(browser, page, launchedBrowser) {
    this.browser = browser;
    this.page = page;
    this.launchedBrowser = launchedBrowser;
    this.events = [];
  }
  async close() {
    return this.launchedBrowser ? this.browser.close() : this.page.close();
  }
  async _value(cell) {
    await this.page.waitForFunction(() => window.notebookModule);
    return await this.page.evaluate(async (cell) => {
      return await window.notebookModule
        .value(cell)
        .then((value) => ({ value }))
        .catch((error) => {
          if (error instanceof window.RuntimeError)
            return { errorType: "runtime", error };
          return { errorType: "other", error };
        });
    }, cell);
  }
  async value(cell) {
    await this.page.waitForFunction(() => window.notebookModule);
    const { value, error, errorType } = await this._value(cell);
    if (!errorType) return value;
    if (errorType === "runtime") {
      if (error.message === `${cell} is not defined`)
        throw new ObservablePrerenderError(
          `There is no cell with name "${cell}" in the embeded notebook.`,
          { cell, error }
        );
      throw new ObservablePrerenderError(
        `An Observable Runtime error occured when getting the value for "${cell}": "${error.message}"`,
        { cell, error }
      );
    }

    throw new ObservablePrerenderError(
      `The cell "${cell}" resolved to an error.`,
      {
        cell,
        error,
      }
    );
  }
  async html(cell, path) {
    await this.waitFor(cell);
    const html = await this.page.$eval(
      `#notebook-${serializeCellName(cell)}`,
      (e) => e.innerHTML
    );
    if (path) return rw.writeFileSync(path, html);
    return html;
  }
  // inspired by https://observablehq.com/@mbostock/saving-svg
  async svg(cell, path) {
    await this.waitFor(cell);
    const html = await this.page.$eval(
      `#notebook-${serializeCellName(cell)} svg`,
      (e) => {
        const xmlns = "http://www.w3.org/2000/xmlns/";
        const xlinkns = "http://www.w3.org/1999/xlink";
        const svgns = "http://www.w3.org/2000/svg";

        const svg = e.cloneNode(true);
        const fragment = window.location.href + "#";
        const walker = document.createTreeWalker(
          svg,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        while (walker.nextNode()) {
          for (const attr of walker.currentNode.attributes) {
            if (attr.value.includes(fragment)) {
              attr.value = attr.value.replace(fragment, "#");
            }
          }
        }
        svg.setAttributeNS(xmlns, "xmlns", svgns);
        svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
        const serializer = new window.XMLSerializer();
        const string = serializer.serializeToString(svg);
        return string;
      }
    );
    if (path)
      return new Promise((resolve, reject) =>
        rw.writeFile(path, html, "utf8", (err) =>
          err ? reject(err) : resolve()
        )
      );
    return html;
  }
  async screenshot(cell, path, options = {}) {
    await this.waitFor(cell);
    const container = await this.page.$(`#notebook-${serializeCellName(cell)}`);
    return await container.screenshot({ path, ...options });
  }

  async pdf(path, options = {}) {
    await this.waitFor();
    options = Object.assign(options, { path: path });
    return await this.page.pdf(options);
  }

  async waitFor(cell) {
    await this.page.waitForFunction(() => window.notebookModule);
    if (!cell) {
      return await this.page.evaluate(async () => {
        // with <3 from https://observablehq.com/@observablehq/notebook-visualizer
        await Promise.all(
          Array.from(window.notebookModule._runtime._variables)
            .filter(
              (v) =>
                !(
                  (v._inputs.length === 1 && v._module !== v._inputs[0]._module) // isimport
                ) && v._reachable
            )
            .filter(
              (v) => v._module !== window.notebookModule._runtime._builtin
            )
            // this is basically .value
            // https://github.com/observablehq/runtime/blob/master/src/module.js#L55-L64
            .map(async (v) => {
              if (v._observer === {}) {
                v._observer = true;
                window.notebookModule._runtime._dirty.add(v);
              }
              await window.notebookModule._runtime._compute();
              await v._promise;
              return true;
            })
        );
        return Promise.resolve(true);
      });
    }
    return await this.page.evaluate(async (cell) => {
      return window.notebookModule.value(cell);
    }, cell);
  }

  // arg files is an object where keys are the file attachment names
  // to override, and values are the (hopefully absolute) path to the
  // local file to replace with.
  async fileAttachments(files = {}) {
    const filesArr = [];
    for (const key in files) {
      filesArr.push([key, files[key]]);
    }
    const filePaths = Object.values(files);

    await this.page.exposeFunction("readfile", async (filePath) => {
      return new Promise((resolve, reject) => {
        if (!filePaths.includes(filePath)) {
          return reject(
            `Only files exposed in the .fileAttachments argument can be exposed.`
          );
        }
        rw.readFile(filePath, "utf8", (err, text) => {
          if (err) reject(err);
          else resolve(text);
        });
      });
    });

    await this.page.evaluate(async (files) => {
      const fa = new Map(
        await Promise.all(
          Object.keys(files).map(async (name) => {
            const file = files[name];
            const content = await window.readfile(file);
            const url = window.URL.createObjectURL(new Blob([content]));
            return [name, url];
          })
        )
      );

      window.notebookModule.redefine("FileAttachment", [], () =>
        window.rt.fileAttachments((name) => fa.get(name))
      );
    }, files);
  }
  async redefine(cell, value) {
    await this.page.waitForFunction(() => window.redefine);
    if (typeof cell === "string") {
      await this.page.evaluate(
        (cell, value) => {
          window.redefine({ [cell]: value });
        },
        cell,
        value
      );
    } else if (typeof cell === "object") {
      await this.page.evaluate((cells) => {
        window.redefine(cells);
      }, cell);
    }
  }
}
async function load(notebook, targets = [], config = {}) {
  // width, height, headless
  let {
    browser,
    page,
    OBSERVABLEHQ_API_KEY,
    headless = true,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    benchmark = false,
    browserWSEndpoint,
  } = config;
  let launchedBrowser = false;
  if (!browser) {
    if (page) browser = page.browser();
    else if (browserWSEndpoint)
      browser = await puppeteer.connect({
        browserWSEndpoint,
      });
    else {
      browser = await puppeteer.launch({
        defaultViewport: { width, height },
        args: [`--window-size=${width},${height}`],
        headless,
      });
      launchedBrowser = true;
    }
  }
  if (!page) {
    page = await browser.newPage();
  }

  const nb = new Notebook(browser, page, launchedBrowser);
  page.exposeFunction(
    "__OBSERVABLE_PRERENDER_BENCHMARK",
    (name, status, time) => {
      nb.events.push({
        type: "benchmark",
        data: { name, status, time },
      });
    }
  );

  await page.setContent(htmlPage, { waitUntil: "load" });

  await page.waitForFunction(() => window.run);

  const result = await page.evaluate(
    async (notebook, targets, OBSERVABLEHQ_API_KEY, benchmark) =>
      window.run({
        notebook,
        targets,
        OBSERVABLEHQ_API_KEY,
        benchmark,
      }),
    notebook,
    targets,
    OBSERVABLEHQ_API_KEY,
    benchmark
  );

  if (result)
    throw new ObservablePrerenderError(
      `Error fetching the notebook ${notebook}. Ensure that the notebook is public or link shared, or pass in an API key with OBSERVABLEHQ_API_KEY.`,
      { error: result }
    );
  return nb;
}

module.exports = {
  load,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  ObservablePrerenderError,
};
