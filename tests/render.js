const { load } = require("../src");

const test = require("tape");

test("render tests", async (t) => {
  const notebook = await load("d/55ca6d4775103132", ["chart", "target"]);
  t.equals(
    await notebook.svg("chart"),
    `<svg width="1184" height="100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="100" y="20">Alex</text></svg>`
  );
  t.equals(await notebook.html("target"), "<div> Whats up, <b>Alex</b>!</div>");

  await notebook.redefine({ name: "norton" });

  t.equals(
    await notebook.svg("chart"),
    `<svg width="1184" height="100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="100" y="20">norton</text></svg>`
  );
  t.equals(
    await notebook.html("target"),
    "<div> Whats up, <b>norton</b>!</div>"
  );

  await notebook.browser.close();
  t.end();
});
