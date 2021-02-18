const readline = require("readline");
const { csvParse } = require("d3-dsv");
const rw = require("rw").dash;
const { DEFAULT_WIDTH, DEFAULT_HEIGHT } = require("../src");
const { isAbsolute, extname } = require("path");

// given a --out /path/to/file.txt and a maybe-provided format,
// ensure there are no conflicts and return proper format.
function consolidateFormat(outPath, format, validFormats, defaultFormat) {
  const outFileExtension = outPath && extname(outPath).slice(1);

  if (outFileExtension) {
    if (format && format !== outFileExtension)
      throw Error(
        `The provided format "${format}" Doesn't match extension "${outFileExtension}" on the given path ${outPath}`
      );
    if (validFormats.has(outFileExtension)) return outFileExtension;
    throw Error(
      `Provided format "${outFileExtension}" is not valid. Not in (${Array.from(
        validFormats
      ).join(", ")}) `
    );
  }

  if (!format) return defaultFormat;
  if (validFormats.has(format)) return format;
  throw Error(
    `Provided format "${format}" is not valid. Not in (${Array.from(
      validFormats
    ).join(", ")}) `
  );
}

// given a commander program, add --redefine, --redefine-file, and --file-attachments options
function applyRedefineOptions(program) {
  return program
    .option("--redefine <cell:value...>", "Redefine a cell (string only)")
    .option(
      "--redefine-file <cell:<string,json,ndjson,csv>:value...>",
      "Redefine a cell with a file"
    )
    .option(
      "--file-attachments <file attachment:path...>",
      "Redefine a file attachment with a local file"
    );
}

// given commander program, add --width, --height, --toke, --no-headless, and --browser-wsendpoint options
function applyBrowserOptions(program) {
  return program
    .option(
      "-w, --width <value>",
      `Width of the Puppeteer browser. Default ${DEFAULT_WIDTH}`
    )
    .option(
      "-h, --height <value>",
      `Height of the Puppeteer browser. Default ${DEFAULT_HEIGHT}`
    )
    .option(
      "--token <token>",
      "An observablehq.com API token to access the notebook."
    )
    .option(
      "--no-headless",
      "Turn off headless mode on the Puppeteer browser, meaning open the browser to the user."
    )
    .option("--browser-wsendpoint <value>", `WS Endpoint of browser to us.`);
}

// run the --redefine, --redefine-file, and --file-attachments
// options found in opts on the given notebook
async function runRedefines(notebook, opts, verbose) {
  const { redefine = [], redefineFile = [], fileAttachments = [] } = opts;

  const redefines = parseArgRedefines(redefine);
  const redefineFiles = parseArgRedefineFiles(redefineFile);
  const redefineFileAttachments = parseArgRedefines(fileAttachments);

  for (const redefine of redefines) {
    const { cell, value, format } = redefine;
    if (verbose) console.log(`Redefining ${cell} with format ${format}`);
    const val = format === "number" ? +value : value;
    notebook.redefine(cell, val);
  }

  for (const redefineFile of redefineFiles) {
    const { cell, value, format: redefineFileFormat } = redefineFile;
    if (verbose)
      console.log(
        `Redefining ${cell} with file ${value} with format ${redefineFileFormat}`
      );
    const data = await valueOfFile(value, redefineFileFormat);
    notebook.redefine(cell, data);
  }

  if (redefineFileAttachments.length > 0) {
    const files = {};
    for (const { cell, value } of redefineFileAttachments) {
      if (verbose)
        console.log(`Replacing FileAttachment ${cell} with file ${value}`);
      files[cell] = isAbsolute(value) ? value : join(process.cwd(), value);
    }
    await notebook.fileAttachments(files);
  }
}

function getNotebookConfig(opts) {
  let { width, height, headless, browserWsendpoint, token } = opts;

  if (width) width = +width;
  if (height) height = +height;

  const config = {
    width,
    height,
    headless,
    browserWSEndpoint: browserWsendpoint,
  };
  console.log(config);
  if (token) config["OBSERVABLEHQ_API_KEY"] = token;

  return config;
}

// read the file found at path with the given format
async function valueOfFile(path, format) {
  switch (format) {
    case "csv":
      return csvParse(rw.readFileSync(path));
    case "ndjson":
      let data = [];
      return await new Promise((resolve, reject) => {
        readline
          .createInterface({
            input: rw.createReadStream(path),
            output: null,
          })
          .on("line", (line) => {
            try {
              data.push(JSON.parse(line));
            } catch (error) {
              reject(error);
            }
          })
          .on("close", () => {
            resolve(data);
          });
      }).catch((error) => {
        console.error(`SyntaxError when reading ${path} as ndjson: `);
        console.error(error.message);
        process.exit(1);
      });
    case "json":
      return JSON.parse(rw.readFileSync(path, "utf8"));
    case "string":
      return rw.readFileSync(path, "utf8");
    default:
      console.error(`Unknown format passed in: ${format}`);
      process.exit(1);
  }
}

// parse list of --redefine flags
function parseArgRedefines(argRedefines) {
  const redefines = [];
  for (const redefine of argRedefines) {
    redefines.push(parseRedefine(redefine));
  }
  return redefines;
}

// parse list of --redefine-file flags
function parseArgRedefineFiles(argRedefineFiles) {
  const redefineFiles = [];
  for (const redefineFile of argRedefineFiles) {
    redefineFiles.push(parseRedefineFile(redefineFile));
  }
  return redefineFiles;
}

// parse "cell:format:value" for --redefine flags
function parseRedefine(redefine) {
  const firstSep = redefine.indexOf(":");
  if (firstSep < 0) {
    console.error(
      `Redefine syntax for "${redefine}" is incorrect. A ':' must be included.`
    );
    process.exit(1);
  }
  const secondSep = redefine.indexOf(":", firstSep + 1);

  const cell = redefine.substring(0, firstSep);
  const value = redefine.substring(
    secondSep > -1 ? secondSep + 1 : firstSep + 1
  );
  const format =
    secondSep > -1 ? redefine.substring(firstSep + 1, secondSep) : "string";
  return { cell, value, format };
}

// Parse "cell:format:path" flag for --redefine-file
function parseRedefineFile(redefine) {
  const firstSep = redefine.indexOf(":");
  let secondSep, format;
  if (firstSep < 0) {
    console.error(
      `Redefine syntax for "${redefine}" is incorrect. A ':' must be included.`
    );
    process.exit(1);
  }
  secondSep = redefine.indexOf(":", firstSep + 1);
  if (secondSep < 0) {
    secondSep = firstSep;
    format = "string";
  } else {
    format = redefine.substring(firstSep + 1, secondSep);
  }

  const cell = redefine.substring(0, firstSep);
  const value = redefine.substring(secondSep + 1);
  return { cell, value, format };
}

module.exports = {
  parseArgRedefines,
  parseArgRedefineFiles,
  valueOfFile,
  applyBrowserOptions,
  applyRedefineOptions,
  runRedefines,
  getNotebookConfig,
  consolidateFormat,
};
