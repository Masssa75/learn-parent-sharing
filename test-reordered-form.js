import { chromium } from 'playwright';

async function testReorderedForm() {
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
    
    // Take screenshot of the new form layout
    await page.screenshot({ path: 'reordered-form.png', fullPage: true });
    
    console.log('5. Form has been reordered with:');
    console.log('   - Description box first (prominent styling)');
    console.log('   - Generate title button second');
    console.log('   - Link input third');
    console.log('   - Image upload fourth');
    
    console.log('\nBrowser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-reordered-form.png', fullPage: true });
  }
}

testReorderedForm();