const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
  });
  
  const context = await browser.newContext({
    permissions: ['microphone']
  });
  const page = await context.newPage();
  
  try {
    console.log('Testing AI Voice Input feature...');
    
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', process.env.DEV_LOGIN_PASSWORD);
    await page.click('button:has-text("Login as Dev Test User")');
    await page.waitForURL('**/feed', { timeout: 10000 });
    
    // 2. Navigate to create page
    console.log('2. Going to create page...');
    await page.click('button:has-text("+")');
    await page.waitForURL('**/create');
    
    // 3. Verify voice mode is default
    console.log('3. Checking voice mode is default...');
    await page.waitForTimeout(1000);
    
    // Take screenshot of voice mode
    await page.screenshot({ 
      path: 'voice-mode-with-link.png',
      fullPage: true 
    });
    console.log('Screenshot saved: voice-mode-with-link.png');
    
    // 4. Add a YouTube link
    console.log('4. Adding YouTube link...');
    const youtubeUrl = 'https://www.youtube.com/watch?v=rvVF4ixHXHY';
    await page.fill('input[placeholder*="Paste link"]', youtubeUrl);
    await page.waitForTimeout(2000);
    
    // Check if YouTube preview loads
    const hasYouTubePreview = await page.locator('.rounded-card').first().isVisible();
    console.log('YouTube preview visible:', hasYouTubePreview);
    
    // 5. Check microphone button
    const micButton = page.locator('button.w-24.h-24.rounded-full');
    const isMicVisible = await micButton.isVisible();
    console.log('Microphone button visible:', isMicVisible);
    
    // Take screenshot with YouTube preview
    await page.screenshot({ 
      path: 'voice-mode-youtube-preview.png',
      fullPage: true 
    });
    console.log('Screenshot saved: voice-mode-youtube-preview.png');
    
    // 6. Test manual mode switch
    console.log('5. Switching to manual mode...');
    await page.click('button:has-text("Write")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'manual-mode-form.png',
      fullPage: true 
    });
    console.log('Screenshot saved: manual-mode-form.png');
    
    console.log('\n✅ Voice AI interface test completed!');
    console.log('\nNote: Actual voice recording requires microphone permissions.');
    console.log('To fully test the AI feature:');
    console.log('1. Paste a link');
    console.log('2. Click microphone and speak about your experience');
    console.log('3. AI will generate title and description');
    console.log('4. Review and share');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'voice-test-error.png' });
  } finally {
    await browser.close();
  }
})();