const { load } = require("../src");

const test = require("tape");

test("basic tests", async (t) => {
  let a, b, c, d;
  const cells = ["a", "b", "c", "d"];
  const notebook = await load("d/b6147a7172ef9c60", cells);
  [a, b, c, d] = await Promise.all(cells.map((d) => notebook.value(d)));

  t.equals(a, 1);
  t.equals(b, 2);
  t.equals(c, 3);
  t.equals(d, 100);

  notebook.redefine("a", 4);
  await notebook.waitFor("c");
  t.equals(await notebook.value("a"), 4);
  t.equals(await notebook.value("c"), 6);

  notebook.redefine({ a: 100, d: "hello" });
  await notebook.waitFor("a");
  await notebook.waitFor("d");
  t.equals(await notebook.value("a"), 100);
  t.equals(await notebook.value("d"), "hello");

  await notebook.browser.close();
  t.end();
});
