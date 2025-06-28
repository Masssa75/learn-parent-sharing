const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Testing new submission form design...');
    
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
    
    // 3. Take screenshot of new form design
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'new-form-design.png',
      fullPage: true 
    });
    console.log('Screenshot saved: new-form-design.png');
    
    // 4. Test Write/Speak toggle
    console.log('3. Testing input mode toggle...');
    
    // Click Speak with AI
    await page.click('button:has-text("Speak with AI")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'voice-mode.png',
      fullPage: true 
    });
    console.log('Screenshot saved: voice-mode.png');
    
    // Back to Write mode
    await page.click('button:has-text("Write")');
    await page.waitForTimeout(500);
    
    // 5. Test form with YouTube link
    console.log('4. Testing YouTube preview...');
    await page.fill('input[placeholder*="Paste link"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'youtube-preview-new.png',
      fullPage: true 
    });
    console.log('Screenshot saved: youtube-preview-new.png');
    
    console.log('\n✅ Form design test completed!');
    console.log('Check the screenshots:');
    console.log('- new-form-design.png: New form layout');
    console.log('- voice-mode.png: Voice input interface');
    console.log('- youtube-preview-new.png: YouTube preview with new design');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'form-test-error.png' });
  } finally {
    await browser.close();
  }
})();