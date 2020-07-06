const puppeteer = require("puppeteer");
const path = require("path");
const querystring = require("querystring");
const fs = require("fs");

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = Math.floor((DEFAULT_WIDTH * 9) / 16);

class Notebook {
  constructor(browser, page) {
    this.browser = browser;
    this.page = page;
  }
  async value(cell) {
    return await this.page.evaluate(async (cell) => {
      return await window.notebookModule.value(cell);
    }, cell);
  }
  // inspired by https://observablehq.com/@mbostock/saving-svg
  async svg(cell, path) {
    await this.waitFor(cell);
    const html = await this.page.$eval(`#notebook-${cell} > svg`, (e) => {
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
    });
    await new Promise((resolve, reject) =>
      fs.writeFile(path, html, "utf8", (err) => (err ? reject(err) : resolve()))
    );
    return;
  }
  async screenshot(cell, path, options = {}) {
    await this.waitFor(cell);
    const container = await this.page.$(`#notebook-${cell}`);
    await container.screenshot({ path, ...options });
    return;
  }
  async waitFor(cell, status = "fulfilled") {
    await this.page.waitForFunction(
      (cell, status) => window.targetStatus.get(cell) === status,
      {},
      cell,
      status
    );
  }
  async redefine(cell, value) {
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
async function load(notebook, targets = [], { browser } = {}) {
  browser = browser
    ? browser
    : await puppeteer.launch({
        defaultViewport: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
        args: [`--window-size=${DEFAULT_WIDTH},${DEFAULT_HEIGHT}`],
      });
  const page = await browser.newPage();
  await page.goto(
    `file://${path.join(
      __dirname,
      "content",
      "index.html"
    )}?${querystring.encode({
      notebook,
      targets: targets.length > 0 ? targets.join(",") : undefined,
    })}`
  );

  await page.content();
  await page.waitForFunction(() => window.redefine && window.targetStatus);
  return new Notebook(browser, page);
}

module.exports = { load };
