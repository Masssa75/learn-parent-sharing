const { chromium } = require('playwright');

async function debugLikes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => console.log('Browser console:', msg.text()));

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    // 2. Wait and check what's on the page
    await page.waitForTimeout(5000);
    
    // 3. Check if posts exist
    const postCount = await page.$$eval('.mb-6', posts => posts.length);
    console.log(`\n2. Found ${postCount} posts on page`);
    
    // 4. Look for any h2 elements
    const titles = await page.$$eval('h2', elements => 
      elements.map(el => el.textContent)
    );
    console.log('\n3. All h2 elements:', titles);
    
    // 5. Look for buttons with "Like" text
    const likeButtons = await page.$$('button');
    console.log(`\n4. Found ${likeButtons.length} buttons total`);
    
    // Check each button
    for (let i = 0; i < Math.min(5, likeButtons.length); i++) {
      const text = await likeButtons[i].textContent();
      const classes = await likeButtons[i].getAttribute('class');
      console.log(`   Button ${i+1}: "${text}" - Yellow: ${classes?.includes('text-brand-yellow')}`);
    }
    
    // 6. Look specifically for the post structure
    const postStructure = await page.evaluate(() => {
      const firstPost = document.querySelector('.rounded-card');
      if (firstPost) {
        return {
          hasPost: true,
          html: firstPost.innerHTML.substring(0, 200),
          classes: firstPost.className
        };
      }
      return { hasPost: false };
    });
    
    console.log('\n5. First post structure:', postStructure);
    
    // 7. Screenshot
    await page.screenshot({ path: 'debug-like-state.png', fullPage: true });
    console.log('\n6. Full page screenshot saved');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugLikes();