const { chromium } = require('playwright');

(async () => {
  console.log('Testing CLAIM +100 button...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to the live site
    console.log('1. Navigating to homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of signed-out state
    await page.screenshot({ path: 'claim-button-visible.png', fullPage: false });
    console.log('2. Screenshot saved: claim-button-visible.png');
    
    // Check if CLAIM +100 button exists
    const claimButton = await page.locator('button:has-text("CLAIM +100")');
    const isVisible = await claimButton.isVisible();
    
    if (isVisible) {
      console.log('✅ CLAIM +100 button is visible!');
      
      // Get button properties
      const buttonText = await claimButton.textContent();
      console.log(`   Button text: "${buttonText}"`);
      
      // Click the button
      console.log('3. Clicking CLAIM +100 button...');
      await claimButton.click();
      
      // Wait for navigation
      await page.waitForURL('**/login', { timeout: 5000 });
      console.log('✅ Successfully redirected to login page!');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'login-page-after-claim.png', fullPage: false });
      console.log('4. Screenshot saved: login-page-after-claim.png');
      
    } else {
      console.log('❌ CLAIM +100 button is NOT visible');
      console.log('   This might mean:');
      console.log('   - You are already signed in');
      console.log('   - The changes haven\'t been deployed yet');
      console.log('   - There\'s an issue with the implementation');
    }
    
    // Also check for SIGN IN button
    const signInButton = await page.locator('text=SIGN IN').first();
    const signInVisible = await signInButton.isVisible();
    console.log(`\nSIGN IN button visible: ${signInVisible ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-state.png', fullPage: false });
  }
  
  console.log('\nTest completed. Check the screenshots for visual confirmation.');
  await browser.close();
})();