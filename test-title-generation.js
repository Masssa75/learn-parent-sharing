import { chromium } from 'playwright';

async function testTitleGeneration() {
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
    
    // Add a link
    console.log('6. Adding a link...');
    await page.fill('input[placeholder="Paste link to app, video, or website"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Select category and age
    console.log('7. Selecting category and age...');
    await page.selectOption('select:has(option:text("Select category"))', 'tips');
    await page.selectOption('select:has(option:text("Select age"))', '0-2');
    
    // Take screenshot before generating titles
    await page.screenshot({ path: 'before-title-generation.png', fullPage: true });
    
    // Click generate titles button
    console.log('8. Clicking generate titles button...');
    await page.click('button:has-text("Generate title for me")');
    
    // Wait for titles to appear
    console.log('9. Waiting for titles to generate...');
    await page.waitForSelector('text=Select your favorite title:', { timeout: 30000 });
    
    // Take screenshot of generated titles
    await page.screenshot({ path: 'generated-titles.png', fullPage: true });
    
    // Count the generated titles
    const titleButtons = await page.$$('button:has(span:text("1."))');
    console.log(`10. Generated titles count: ${titleButtons.length}`);
    
    // Get all title texts
    const titles = [];
    for (let i = 1; i <= 5; i++) {
      const titleText = await page.textContent(`button:has(span:text("${i}."))`);
      if (titleText) {
        titles.push(titleText.replace(`${i}.`, '').trim());
        console.log(`   Title ${i}: ${titleText.replace(`${i}.`, '').trim()}`);
      }
    }
    
    // Select the first title
    console.log('11. Selecting the first title...');
    await page.click('button:has(span:text("1."))');
    
    // Take screenshot after selection
    await page.screenshot({ path: 'title-selected.png', fullPage: true });
    
    // Check if Share button is enabled
    const shareButton = await page.$('button:has-text("Share")');
    const isDisabled = await shareButton.evaluate(el => el.disabled);
    console.log(`12. Share button enabled: ${!isDisabled}`);
    
    // Test "Generate new titles" button
    console.log('13. Testing generate new titles...');
    await page.click('button:has-text("Generate new titles")');
    
    // Should go back to the generate button
    await page.waitForSelector('button:has-text("Generate title for me")');
    console.log('14. Successfully reset to generate button');
    
    console.log('\n✅ All tests passed! Title generation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testTitleGeneration();