const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OVERLEAF_READ_SHARE_URL = 'https://www.overleaf.com/read/xdjkjrjcqyym';
const PROJECT_NAME = 'Bachelor Thesis';

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
    await waitForFile(`${PROJECT_NAME}.zip`);

    console.log('All done! Closing browser...');
    await browser.close();
})().catch(console.error);

/**
 * Funzione per controllare se un file esiste e non aumenta di dimensione nell'ultimo secondo.
 *
 * @param {string} fileName - Nome del file da controllare.
 * @returns {Promise} Una Promise che si risolve quando il file esiste e non aumenta di dimensione nell'ultimo secondo.
 */
const waitForFile = async (fileName) => {
  return new Promise((resolve, reject) => {
    const filePath = __dirname + '/' + fileName; // Aggiungi il percorso del file in base alla tua configurazione
    let previousSize = 0;

    // Funzione di callback per fs.watchFile
    const fileChanged = (curr, prev) => {
      if (curr.size === prev.size) {
        // Il file non è aumentato di dimensione nell'ultimo secondo
        fs.unwatchFile(filePath, fileChanged);
        resolve();
      } else {
        // Il file è aumentato di dimensione nell'ultimo secondo
        previousSize = curr.size;
      }
    };

    // Controlla se il file esiste
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // Se il file non esiste, considera la sua dimensione come zero
        previousSize = 0;
        // Inizia a osservare il file per i cambiamenti
        fs.watchFile(filePath, { interval: 1000 }, fileChanged);
      } else {
        // Se il file esiste, controlla la sua dimensione
        fs.stat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            // Considera la dimensione del file come zero se non esiste
            previousSize = stats.size;
            // Inizia a osservare il file per i cambiamenti
            fs.watchFile(filePath, { interval: 1000 }, fileChanged);
          }
        });
      }
    });
  });
};
