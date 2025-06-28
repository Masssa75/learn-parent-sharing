const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Testing YouTube embedding feature...');
    
    // 1. Go to dev login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', process.env.DEV_LOGIN_PASSWORD);
    await page.click('button:has-text("Login as Dev Test User")');
    await page.waitForURL('**/feed', { timeout: 10000 });
    
    // 2. Navigate to create page
    console.log('2. Going to create page...');
    await page.click('button:has-text("+")');
    await page.waitForURL('**/create');
    
    // 3. Fill in the form with a YouTube URL
    console.log('3. Filling form with YouTube URL...');
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'create-page-state.png' });
    
    await page.fill('input[placeholder*="What made parenting easier"]', 'Amazing Educational Video for Kids');
    await page.fill('textarea', 'This Numberblocks episode helps kids learn counting in a fun way!');
    
    // Select category - wait for it to be visible
    await page.waitForSelector('select', { state: 'visible' });
    const selects = await page.locator('select').all();
    console.log(`Found ${selects.length} select elements`);
    
    if (selects.length >= 2) {
      await selects[0].selectOption('education');
      await selects[1].selectOption('3-5');
    } else {
      throw new Error('Expected 2 select elements, found: ' + selects.length);
    }
    
    // 4. Add YouTube URL and check for preview
    console.log('4. Adding YouTube URL...');
    const youtubeUrl = 'https://www.youtube.com/watch?v=2ZtG5Ba6iT0';
    await page.fill('input[placeholder*="Link to product"]', youtubeUrl);
    
    // Wait a moment for the preview to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of the create page with YouTube preview
    await page.screenshot({ 
      path: 'youtube-preview-create.png',
      fullPage: true 
    });
    console.log('Screenshot saved: youtube-preview-create.png');
    
    // 5. Submit the post
    console.log('5. Submitting post...');
    await page.click('button:has-text("Share"):not([type="button"])');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
    await page.waitForTimeout(2000);
    
    // 6. Check if the YouTube video appears in the feed
    console.log('6. Checking feed for YouTube embed...');
    
    // Take screenshot of the feed with YouTube player
    await page.screenshot({ 
      path: 'youtube-player-feed.png',
      fullPage: true 
    });
    console.log('Screenshot saved: youtube-player-feed.png');
    
    // Check if iframe exists (YouTube player)
    const hasYouTubePlayer = await page.locator('iframe[src*="youtube.com/embed"]').count() > 0;
    console.log('YouTube player found in feed:', hasYouTubePlayer);
    
    console.log('\n✅ YouTube embedding test completed!');
    console.log('Check the screenshots to see:');
    console.log('- youtube-preview-create.png: Preview in create form');
    console.log('- youtube-player-feed.png: Embedded player in feed');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'youtube-test-error.png' });
  } finally {
    await browser.close();
  }
})();