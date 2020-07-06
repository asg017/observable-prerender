const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-barchart");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load("@d3/bar-chart", ["chart", "data"]);
  const data = [
    { name: "alex", value: 20 },
    { name: "brian", value: 30 },
    { name: "craig", value: 10 },
  ];
  await notebook.redefine("data", data);
  await notebook.screenshot("chart", join(OUT_DIR, "bar-chart.png"));
  await notebook.browser.close();
})();
