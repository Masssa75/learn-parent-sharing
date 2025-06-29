const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing Title Case functionality on deployed app...\n');

    // Navigate to the app
    await page.goto('https://parentshare.netlify.app/');
    await page.waitForLoadState('networkidle');

    // Login with test account
    console.log('1. Logging in...');
    await page.click('a[href="/login"]');
    await page.waitForSelector('iframe');
    
    const telegramFrame = page.frameLocator('iframe');
    await telegramFrame.locator('button:has-text("marc.schwyn")').click();
    
    await page.waitForURL('https://parentshare.netlify.app/', { timeout: 10000 });
    console.log('✓ Logged in successfully');

    // Navigate to create post page
    console.log('\n2. Navigating to create post page...');
    await page.click('button[aria-label="Create a post"]');
    await page.waitForSelector('input[placeholder="What made parenting easier today?"]');
    console.log('✓ On create post page');

    // Test cases for Title Case conversion
    const testCases = [
      {
        input: 'this is a great app for kids',
        expected: 'This Is a Great App for Kids'
      },
      {
        input: 'THE BEST TOY FOR TODDLERS',
        expected: 'The Best Toy for Toddlers'
      },
      {
        input: 'AI powered learning app review',
        expected: 'AI Powered Learning App Review'
      },
      {
        input: 'tips and tricks for bedtime',
        expected: 'Tips and Tricks for Bedtime'
      }
    ];

    console.log('\n3. Testing Title Case conversion...');
    
    for (const testCase of testCases) {
      console.log(`\nTesting: "${testCase.input}"`);
      
      // Fill in the form
      await page.fill('input[placeholder="Paste link to app, video, or website"]', 'https://example.com');
      await page.fill('input[placeholder="What made parenting easier today?"]', testCase.input);
      await page.fill('textarea[placeholder="Tell other parents about your experience..."]', 'This is a test description to verify Title Case functionality.');
      
      // Select category
      await page.selectOption('select:has-text("Select category")', 'apps');
      
      // Select age range
      await page.selectOption('select:has-text("Select age")', '3-5');
      
      // Submit the form
      await page.click('button:has-text("Share")');
      
      // Wait for redirect to home page
      await page.waitForURL('https://parentshare.netlify.app/', { timeout: 10000 });
      await page.waitForSelector('[data-testid="post-item"]', { timeout: 10000 });
      
      // Check the first post (most recent)
      const firstPost = page.locator('[data-testid="post-item"]').first();
      const postTitle = await firstPost.locator('h3').textContent();
      
      console.log(`Submitted: "${testCase.input}"`);
      console.log(`Displayed: "${postTitle}"`);
      console.log(`Expected:  "${testCase.expected}"`);
      
      if (postTitle === testCase.expected) {
        console.log('✓ Title Case conversion working correctly!');
      } else {
        console.log('✗ Title Case conversion not matching expected result');
      }
      
      // Navigate back to create page for next test
      await page.click('button[aria-label="Create a post"]');
      await page.waitForSelector('input[placeholder="What made parenting easier today?"]');
    }

    console.log('\n✅ Title Case functionality testing complete!');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();