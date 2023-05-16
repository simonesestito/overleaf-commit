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
 * Check if a file exists and does not increase in size in the last X amount of time.
 * That may mean that the file is completely downloaded.
 *
 * @param {string} fileName - File name to check.
 * @returns {Promise} A Promise that resolves when the file is completely downloaded.
 */
async function waitForFile(fileName) {
    const filePath = __dirname + '/' + fileName; // Add current directory path
    let previousSize = 0, currentSize = 0;

    // Every X amount of time, check if file is completely downloaded
    do {
      await waitMillis(200);
      // Get the new size
      previousSize = currentSize;
      currentSize = await getFileSize(filePath);
      console.log('\t', currentSize, 'bytes downloaded');
    } while (currentSize !== previousSize || currentSize === 0);
}

async function waitMillis(millis) {
  return new Promise(resolve => {
    setTimeout(resolve, millis);
  });
}

async function getFileSize(filename) {
  return new Promise(resolve => {
    fs.stat(filename, (err, stats) => {
      if (err) {
        resolve(0); // If file does not exist, consider its size as zero
      } else {
        resolve(stats.size);
      }
    });
  });
}