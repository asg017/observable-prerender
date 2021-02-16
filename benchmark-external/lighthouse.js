const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const { URL } = require("url");
const { writeFileSync, readdirSync } = require("fs");
const { join } = require("path");
const Database = require("better-sqlite3");

const NUM_RUNS = 5;

(async () => {
  const browser = await puppeteer.launch();
  const data = [];
  const db = new Database("lighthouse-reports.db");
  db.exec(
    "CREATE TABLE IF NOT EXISTS reports(notebook TEXT, file TEXT, data TEXT);"
  );
  const insert = db.prepare(
    "INSERT INTO reports (notebook, file, data) VALUES (@notebook, @file, @data)"
  );

  for (const notebookDir of readdirSync(join(__dirname, "out-pages"))) {
    for (const file of readdirSync(join(__dirname, "out-pages", notebookDir))) {
      if (!file.endsWith(".html")) continue;

      console.log(notebookDir, file);

      const runs = [];
      for (let i = 0; i < NUM_RUNS; i++) {
        console.log(`\t${i}`);
        const { lhr } = await lighthouse(
          `http://localhost:8000/${notebookDir}/${file}`,
          {
            port: new URL(browser.wsEndpoint()).port,
            output: "json",
            logLevel: "error",
            onlyCategories: ["performance"],
          }
        );
        insert.run({
          notebook: notebookDir,
          file,
          run: i,
          data: JSON.stringify(lhr),
        });
      }
      /*data.push({
        notebookDir,
        file,
        lhr: median,
      });*/
    }
  }
  //writeFileSync("lighthouse-scores.json", JSON.stringify(data));
  await browser.close();
  db.close();
})();
