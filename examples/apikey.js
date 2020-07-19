const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-apikey");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load("d/c8a268537d9561d7", ["password"], {
    OBSERVABLEHQ_API_KEY: process.env.OBSERVABLEHQ_API_KEY,
  });
  console.log(`SECRET: "${await notebook.value("password")}"`);
  await notebook.browser.close();
})();
