const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-suntime");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async function () {
  const notebook = await load("@asg017/sunrise-and-sunset-worldwide", [
    "graphic",
    "controller",
  ]);
  notebook.redefine({ coordinates: [-51.42, -57.51] });
  const times = await notebook.value("times");
  for (let i = 0; i < times.length; i++) {
    console.log(`${i}/${times.length}`);
    await notebook.redefine("timeI", i);
    await notebook.waitFor("controller");
    await notebook.screenshot(
      "graphic",
      join(OUT_DIR, `sun${("000" + i).slice(-3)}.png`)
    );
  }
  await notebook.browser.close();
})();
