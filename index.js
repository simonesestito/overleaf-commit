const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OVERLEAF_READ_SHARE_URL = process.env.OVERLEAF_READ_SHARE_URL;
const ZIP_PROJECT = process.env.ZIP_PROJECT;

(async () => {
    const browser = await puppeteer.launch();

    console.log('Opening new browser page...');
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});
    
    console.log('Loading Overleaf project...');
    await page.goto(OVERLEAF_READ_SHARE_URL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.toolbar-pdf-left');

    const client = await page.target().createCDPSession();

    console.log('Setting download path...');
    const downloadPath = path.resolve('.');
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });

    console.log('Clicking on side menu button...');
    const sideMenuButton = '.fa.fa-bars.fa-fw.editor-menu-icon';
    await page.waitForSelector(sideMenuButton);
    await page.click(sideMenuButton);

    console.log('Clicking on download button...');
    const downloadZipButton = 'a[ng-href] .fa-file-archive-o';
    await page.waitForSelector(downloadZipButton);
    await new Promise(res => setTimeout(res, 1000));

    console.log('Downloading project as zip file...');
    await page.click(downloadZipButton);
    await waitForFile(ZIP_PROJECT);

    console.log('All done! Closing browser...');
    await browser.close();
})().catch(console.error);

/**
 * Check if a file exists and does not increase in size in the last second.
 * That may mean that the file is completely downloaded.
 *
 * @param {string} fileName - File name to check.
 * @returns {Promise} A Promise that resolves when the file is completely downloaded.
 */
const waitForFile = async (fileName) => {
  return new Promise((resolve, reject) => {
    const filePath = __dirname + '/' + fileName; // Add current directory path
    let previousSize = 0;

    // Callback function to be executed when fs.watchFile detects changes
    const fileChanged = (curr, prev) => {
      if (curr.size === prev.size && curr.size > 0) {
        // File size is not changing anymore
        fs.unwatchFile(filePath, fileChanged);
        resolve();
      } else {
        // File size changed, let's wait for another onChange event
        previousSize = curr.size;
      }
    };

    // Check if file already exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File does not exist, yet. Consider its size as zero.
        previousSize = 0;
        // Start watching the file for changes
        fs.watchFile(filePath, { interval: 1000 }, fileChanged);
      } else {
        // If file already exists, consider its current size as previous
        fs.stat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            // Start watching the file for changes
            previousSize = stats.size;
            fs.watchFile(filePath, { interval: 1000 }, fileChanged);
          }
        });
      }
    });
  });
};
