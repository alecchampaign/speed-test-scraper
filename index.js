//const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

async function runTest(url) {
    // start puppeteer
    puppeteerExtra.use(pluginStealth());
    const browser = await puppeteerExtra.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    // set a random user agent & viewport to avoid captcha detection
    await page.setUserAgent(randomUseragent.getRandom());
    await page.setViewport({
        width: 1920,
        height: 5000,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });
    
    await page.goto('https://www.webpagetest.org', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: './screenshot.jpg'});
    // enter url in input and run test
    await page.type('#url', url);
    await page.screenshot({ path: './screenshot1.jpg'});
    await page.click('.start_test');
    try {
        await page.waitForNavigation({waitUntil: "domcontentloaded"});
    } catch {
        console.log('ERROR: CAPTCHA')
        await page.screenshot({ path: './error.jpg'});
    }
    await page.screenshot({ path: './screenshot2.jpg'});

    await page.waitForNavigation({waitUntil: "domcontentloaded"});

    const results = {
        startRender: await page.$eval('#StartRender', elem => elem.innerText),
        speedIndex: await page.$eval('#SpeedIndex', elem => elem.innerText),
        webVitals: {
            //LCP: await page.$eval('#chromeUserTiming.LargestContentfulPaint', elem => elem.innerText),
            // CLS: await page.$eval('#chromeUserTiming.CumulativeLayoutShift', elem => elem.innerText),
            TBT: await page.$eval('#TotalBlockingTime', elem => elem.innerText)
        },
        documentComplete: {

        },
        documentLoaded: {

        }
    }

    console.log(results);
}

runTest('https://www.analuisa.com');