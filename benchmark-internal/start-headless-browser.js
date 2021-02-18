const puppeteer = require("puppeteer");
async function main() {
  const browser = await puppeteer.launch({ headless: true });
  console.log(browser.wsEndpoint());
}
main();
