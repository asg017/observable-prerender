const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-italy-covid");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load("d/faa5f8296c8ee793", [
    "map",
    "style",
    "control1",
    "control2",
  ]);
  const dates = await notebook.value("dates");
  let i = 0;
  for (let i = 0; i < dates.length; i++) {
    console.log(i);
    await notebook.redefine("index", i);
    await notebook.screenshot("map", join(OUT_DIR, `${i}.png`));
  }
  await notebook.browser.close();
})();
