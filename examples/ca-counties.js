const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-ca-counties");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load(
    "@datadesk/base-maps-for-all-58-california-counties",
    ["chart", "viewof county"]
  );
  notebook.waitFor("chart");
  const counties = await notebook.value("counties");
  for await (let county of counties) {
    console.log(`Doing ${county.name}`);
    await notebook.redefine("county", county.fips);
    await notebook.waitFor("chart");
    await notebook.screenshot("chart", join(OUT_DIR, `${county.name}.png`));
    await notebook.svg("chart", join(OUT_DIR, `${county.name}.svg`));
  }
  await notebook.browser.close();
})();
