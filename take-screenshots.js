const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshot() {
  console.log('Starting browser for screenshot...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Navigating to insights page...');
    await page.goto('http://localhost:3000/insights', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Taking screenshot...');
    const screenshotPath = path.join(__dirname, 'testing_screenshots', 'insights-dashboard.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });

    console.log(`Screenshot saved: ${screenshotPath}`);

    // Take screenshot of songs page
    console.log('Navigating to songs page...');
    await page.goto('http://localhost:3000/songs', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const songsScreenshotPath = path.join(__dirname, 'testing_screenshots', 'songs-page.png');
    await page.screenshot({ 
      path: songsScreenshotPath,
      fullPage: true 
    });

    console.log(`Screenshot saved: ${songsScreenshotPath}`);

    // Take screenshot of playlists page
    console.log('Navigating to playlists page...');
    await page.goto('http://localhost:3000/playlists', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const playlistsScreenshotPath = path.join(__dirname, 'testing_screenshots', 'playlists-page.png');
    await page.screenshot({ 
      path: playlistsScreenshotPath,
      fullPage: true 
    });

    console.log(`Screenshot saved: ${playlistsScreenshotPath}`);

  } catch (error) {
    console.error('Screenshot error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot().catch(console.error);