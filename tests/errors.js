const { load, ObservablePrerenderError } = require("../src");
const puppeteer = require("puppeteer");
const test = require("tape");

test("ObservablePrerenderError throws stuff", async (t) => {
  const browser = await puppeteer.launch();
  await load("@asg017/i-do-not-exist", [], { browser })
    .then(t.fail)
    .catch((error) => {
      t.true(error instanceof ObservablePrerenderError);
      t.true(
        error.message.startsWith(
          "Error fetching the notebook @asg017/i-do-not-exist"
        )
      );
    });

  const notebook = await load("@asg017/bar-chart-errors", [], { browser });

  t.true((await notebook.value("color")) === "steelblue");

  await notebook
    .value("notExist")
    .then(t.fail)
    .catch((error) => {
      t.true(error instanceof ObservablePrerenderError);
      t.equals(
        error.message,
        `There is no cell with name "notExist" in the embeded notebook.`
      );
    });

  await notebook
    .value("yodaError")
    .then(t.fail)
    .catch((error) => {
      t.true(error instanceof ObservablePrerenderError);
      t.equals(error.message, `The cell "yodaError" resolved to an error.`);
    });

  await notebook
    .value("circ")
    .then(t.fail)
    .catch((error) => {
      t.true(error instanceof ObservablePrerenderError);
      t.equals(
        error.message,
        `An Observable Runtime error occured when getting the value for "circ": "circ is defined more than once"`
      );
    });

  await browser.close();
  t.end();
});
