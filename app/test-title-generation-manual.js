import { chromium } from 'playwright';

async function testManually() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to test-auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    // Login
    console.log('2. Logging in...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("devtest")');
    
    // Wait for redirect
    await page.waitForURL('**/');
    console.log('3. Logged in successfully');
    
    // Navigate to create page
    console.log('4. Going to create page...');
    await page.click('a[href="/create"]');
    await page.waitForURL('**/create');
    
    // Fill in the form
    console.log('5. Filling in the description...');
    const description = "We discovered that playing classical music during bath time completely transforms our toddler's attitude. He used to scream and fight every bath, but now with Mozart playing, he happily plays for 20 minutes. It's been a game changer for our evening routine.";
    
    await page.fill('textarea[placeholder="Describe your tip or what you learned today..."]', description);
    
    console.log('6. Form filled. Browser will stay open for manual testing.');
    console.log('   - Try clicking "Generate title for me" button');
    console.log('   - Check browser console for errors');
    console.log('   - Press Ctrl+C to close when done');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testManually();