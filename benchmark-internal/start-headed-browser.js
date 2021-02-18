const puppeteer = require("puppeteer");
async function main() {
  const browser = await puppeteer.launch({ headless: false });
  console.log(browser.wsEndpoint());
}
main();
