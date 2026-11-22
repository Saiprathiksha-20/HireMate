const { join } = require("path")

/**
 * Store the Chrome that Puppeteer downloads INSIDE the project folder.
 * On Render the default location (~/.cache) is not kept after the build,
 * which causes "Could not find Chrome" when downloading the resume PDF.
 */
module.exports = {
    cacheDirectory: join(__dirname, ".cache", "puppeteer"),
}
