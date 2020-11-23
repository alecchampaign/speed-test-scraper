const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

// Yargs
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

async function runTest(url, sheetName) {
    // start puppeteer
    puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    // set a random user agent & viewport to avoid captcha detection
    await page.setUserAgent(randomUseragent.getRandom());
    await page.setViewport({
        width: 1440,
        height: 5000,
        deviceScaleFactor: 3,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });
    
    // Step 1: Go to webpagetest and run test
    await page.goto('https://www.webpagetest.org', { waitUntil: 'domcontentloaded' });

    // enter url in input, select test type, run the test
    await page.type('#url', url);
    await page.select('#location', 'Mobile_Dulles_MotoG4');
    await page.click('.start_test');

    // Step 2: Wait for test to complete
    try {
        await page.waitForNavigation({waitUntil: "domcontentloaded"});
    } catch {
        console.log('ERROR: CAPTCHA')
    }

    // Step 3: Scrape test results
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 0 });

    const results = {
        startRender: await page.$eval('#StartRender', elem => Number(elem.innerText.replace('s', ''))).catch(() => console.error('MISSING: StartRender')),
        speedIndex: await page.$eval('#SpeedIndex', elem => Number(elem.innerText)).catch(() => console.error('MISSING: SpeedIndex')),
        webVitals: {
            LCP: await page.$eval('#chromeUserTiming\\.LargestContentfulPaint', elem => Number(elem.innerText.replace('s', ''))).catch(() => console.error('MISSING: LCP')),
            CLS: await page.$eval('#chromeUserTiming\\.CumulativeLayoutShift', elem => Number(elem.innerText)).catch(() => console.error('MISSING: CLS')),
            TBT: await page.$eval('#TotalBlockingTime', elem => elem.innerText).catch(() => console.error('MISSING: TBT'))
        },
        documentComplete: {
            time: await page.$eval('#DocComplete', elem => Number(elem.innerText.replace('s', ''))).catch(() => console.error('MISSING: DocComplete Time')),
            requests: await page.$eval('#RequestsDoc', elem => Number(elem.innerText)).catch(() => console.error('MISSING: DocComplete Requests'))
        },
        documentLoaded: {

        }
    }
    console.log(results);
}

runTest(argv.url, argv.sheet);