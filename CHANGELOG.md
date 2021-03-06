# Changelog

## [v0.4.0] - 2021-02-18

### Added

- `notebook.$(cellName)` method to get the ElementHandle of a cell's container.
- New `--browser-wsendpoint` on `op` CLI programs for connecting to remote browser instances.
- Better error handling when loading non-existant notebook and cells.
- `notebook.close()` to close the notebook's browser when done, or only the notebook's page if connected to remote browser.

### Fixed

- Bugs on some CLI programs that didn't allow reading from stdin in `--redefine-file` and `--file-attachments`

## [v0.3.0] - 2021-02-16

### Added

- CLI `observable-prerender-open`, to open a given notebook in a Puppeteer browser for easier debugging.
- CLI an alpha version of `observable-prerender-benchmark`, to benchmark a given notebook's cell execution time.
- CLI programs now have `op-*` aliases cooresponding to `observable-prerender-*` programs.
- `--format=html`, `--format=text`, `--format=json` options for `observable-prerender`.

## Changed

- CLI and Node library use `rw` instead of `fs`, allowing for easier `stdin`/`stdout` usage with `path="-"`.
- Added `notebook.html(cell)` utility that returns the `.outerHTML` value of a given cell.
- In `observable-prerender`, `--quiet` has been depracated in favor of `--verbose`, meaning progress logs are now opt-in.
- `notebook.waitFor(cell)`'s 2nd parameter, `status`, has been deprecated. Now only waiting for a cell to become `fullfilled` is supported.

## [v0.1.0] - 2020-08-07

### Added

- New CLI programs `observable-prerender` and `observable-prerender-animate`.
- `width`, `height`, and `headless` options to `load()`'s config parameter, for setting the width/height of a new Puppeteer browser, and for determining of that browser should be headless.
- `notebook.fileAttachments`, for replacing Observable notebook FileAttachments with local files.
