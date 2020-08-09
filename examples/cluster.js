const { Cluster } = require("puppeteer-cluster");

const { load } = require("../src");
const { existsSync, mkdirSync, removeSync } = require("fs-extra");
const { join } = require("path");

const OUT_DIR = join(__dirname, "out-cluster");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR);
} else {
  removeSync(OUT_DIR);
  mkdirSync(OUT_DIR);
}

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  await cluster.task(async ({ page, data: notebookId }) => {
    const notebook = await load(notebookId, ["chart"], { page });
    await notebook.screenshot(
      "chart",
      join(OUT_DIR, `${notebookId}.png`.replace("/", "_"))
    );
  });

  cluster.queue("@d3/bar-chart");
  cluster.queue("@d3/line-chart");
  cluster.queue("@d3/directed-chord-diagram");
  cluster.queue("@d3/spike-map");
  cluster.queue("@d3/fan-chart");

  await cluster.idle();
  await cluster.close();
})();
