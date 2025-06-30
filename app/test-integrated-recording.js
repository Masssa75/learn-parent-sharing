import { chromium } from 'playwright';

async function testIntegratedRecording() {
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
    
    // Take screenshot of the form
    await page.screenshot({ path: 'create-form-with-mic.png', fullPage: true });
    
    // Check if mic button is visible
    const micButton = await page.$('button[title="Record your tip"]');
    if (micButton) {
      console.log('5. ✅ Microphone button found in textarea');
      const buttonPosition = await micButton.boundingBox();
      console.log(`   Position: bottom-right of textarea at ${buttonPosition?.x}, ${buttonPosition?.y}`);
    } else {
      console.log('5. ❌ Microphone button not found');
    }
    
    // Fill in other fields to test full form
    console.log('6. Filling in the form...');
    await page.fill('input[placeholder="Paste link to app, video, or website"]', 'https://example.com');
    await page.selectOption('select:has(option:text("Select category"))', 'tips');
    await page.selectOption('select:has(option:text("Select age"))', '3-5');
    
    // Type some text in description
    await page.fill('textarea[placeholder="Describe your tip or what you learned today..."]', 'This is a test description. ');
    
    console.log('7. Form filled. Browser will stay open.');
    console.log('   - Click the microphone button to test recording');
    console.log('   - The recorded text should append to the description');
    console.log('   - No mode switching - everything in one form!');
    console.log('   - Press Ctrl+C to close when done');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-integrated-recording.png', fullPage: true });
  }
}

testIntegratedRecording();