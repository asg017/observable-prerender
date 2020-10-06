const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-pdf");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load("@jrus/scpie");
  const notebookStyling = await load("d/d2faf59bd6493a6d", [], {
    browser: notebook.browser,
  });

  await notebook.pdf(join(OUT_DIR, "notebook.pdf"));
  await notebookStyling.pdf(join(OUT_DIR, "notebook-styling.pdf"));

  await notebook.browser.close();
})();
