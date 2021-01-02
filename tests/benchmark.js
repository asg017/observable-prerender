const { load } = require("../src");
const { group } = require("d3-array");
const test = require("tape");

test("benchmarks tests", async (t) => {
  const notebook = await load("d/32b4a089fbb4be18", ["c", "z"], {
    benchmark: true,
  });
  await notebook.value("c");
  await notebook.value("z");
  const benchmarkEvents = notebook.events
    .filter((d) => d.type === "benchmark")
    .map((d) => d.data);
  const g = group(
    benchmarkEvents,
    (d) => d.name,
    (d) => d.status
  );
  console.log(benchmarkEvents, g, g.get("a"));
  t.true(
    g.get("a").get("fulfilled")[0].time <= g.get("c").get("fulfilled")[0].time
  );
  t.true(
    g.get("b").get("fulfilled")[0].time <= g.get("c").get("fulfilled")[0].time
  );

  const xTime =
    g.get("x").get("fulfilled")[0].time - g.get("x").get("pending")[0].time;
  const yTime =
    g.get("y").get("fulfilled")[0].time - g.get("y").get("pending")[0].time;
  const zTime =
    g.get("z").get("fulfilled")[0].time - g.get("z").get("pending")[0].time;

  t.true(!Number.isNaN(xTime), 100 < xTime < 110);
  t.true(!Number.isNaN(yTime), 50 < yTime < 60);
  t.true(!Number.isNaN(yTime), 0 < zTime < 10);

  await notebook.browser.close();
  t.end();
});
