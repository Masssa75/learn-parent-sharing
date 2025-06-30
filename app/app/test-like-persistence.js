const { chromium } = require('playwright');

async function testLikePersistence() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('DEBUG:')) {
      console.log('Browser console:', msg.text());
    }
  });

  try {
    // 1. Login as devtest
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    console.log('✓ Logged in successfully');

    // 2. Wait for posts to load
    await page.waitForTimeout(3000);
    
    // 3. Check if any posts show as liked
    const likedPosts = await page.$$('button svg[fill="currentColor"]');
    console.log(`\n2. Found ${likedPosts.length} liked posts on initial load`);
    
    // 4. Get the first post that isn't liked yet
    const unlikedButton = await page.$('button:has(svg[fill="none"]):has-text("Like")');
    if (unlikedButton) {
      const postText = await unlikedButton.evaluate(btn => {
        const post = btn.closest('[class*="rounded-card"]');
        return post?.querySelector('h2')?.textContent || 'Unknown post';
      });
      console.log(`\n3. Found unliked post: "${postText}"`);
      
      // Click to like it
      console.log('4. Clicking like button...');
      await unlikedButton.click();
      await page.waitForTimeout(2000);
      
      // Check if it turned yellow
      const isYellow = await unlikedButton.evaluate(btn => 
        btn.classList.contains('text-brand-yellow')
      );
      console.log(`✓ Button turned yellow: ${isYellow}`);
      
      // 5. Refresh the page
      console.log('\n5. Refreshing page...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      // 6. Check if the like persisted
      const postAfterRefresh = await page.$(`h2:has-text("${postText}")`);
      if (postAfterRefresh) {
        const likeButton = await postAfterRefresh.evaluateHandle(h2 => {
          const post = h2.closest('[class*="rounded-card"]');
          return post?.querySelector('button:has(svg):has-text("Like")');
        });
        
        const isPersisted = await likeButton.evaluate(btn => {
          const svg = btn?.querySelector('svg');
          const isYellow = btn?.classList.contains('text-brand-yellow');
          const isFilled = svg?.getAttribute('fill') === 'currentColor';
          return { isYellow, isFilled, text: btn?.textContent };
        });
        
        console.log('\n6. After refresh:');
        console.log(`   - Button is yellow: ${isPersisted.isYellow}`);
        console.log(`   - Heart is filled: ${isPersisted.isFilled}`);
        console.log(`   - Button text: ${isPersisted.text}`);
      }
    } else {
      console.log('\n3. All posts are already liked!');
    }
    
    // 7. Check console logs for DEBUG messages
    console.log('\n7. Waiting for any DEBUG logs...');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testLikePersistence();