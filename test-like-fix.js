const { chromium } = require('playwright');

async function testLikeFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Login
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    console.log('✓ Logged in');
    
    // 2. Wait for posts to load
    await page.waitForTimeout(4000); // Give time for auth then posts fetch
    
    // 3. Find "BEST TV Series" post (should be liked based on our DB check)
    const tvPost = await page.$('h2:has-text("BEST TV Series")');
    if (tvPost) {
      const likeButton = await page.$('h2:has-text("BEST TV Series") ~ * button:has-text("Like")');
      if (likeButton) {
        const isYellow = await likeButton.evaluate(btn => 
          btn.classList.contains('text-brand-yellow')
        );
        console.log(`\n2. "BEST TV Series" post like button is ${isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
      }
    }
    
    // 4. Find an unliked post and like it
    const unlikedButton = await page.$('button:not(.text-brand-yellow):has-text("Like")');
    if (unlikedButton) {
      const postTitle = await unlikedButton.evaluate(btn => {
        const post = btn.closest('.mb-6');
        return post?.querySelector('h2')?.textContent || 'Unknown';
      });
      console.log(`\n3. Found unliked post: "${postTitle.substring(0, 40)}..."`);
      console.log('   Clicking like...');
      await unlikedButton.click();
      await page.waitForTimeout(2000);
      
      // 5. Refresh and check
      console.log('\n4. Refreshing page...');
      await page.reload();
      await page.waitForTimeout(4000); // Give time for auth then posts fetch
      
      // Find the same post
      const samePost = await page.$(`h2:text("${postTitle.substring(0, 20)}")`);
      if (samePost) {
        const likeButtonAfter = await page.$(`h2:text("${postTitle.substring(0, 20)}") ~ * button:has-text("Like")`);
        if (likeButtonAfter) {
          const isYellowAfter = await likeButtonAfter.evaluate(btn => 
            btn.classList.contains('text-brand-yellow')
          );
          console.log(`\n5. After refresh, like button is ${isYellowAfter ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
          
          if (isYellowAfter) {
            console.log('\n✅ SUCCESS: Like persistence is working!');
          } else {
            console.log('\n❌ BUG: Like is not persisting after refresh');
          }
        }
      }
    }
    
    await page.screenshot({ path: 'like-fix-test.png' });
    console.log('\n6. Screenshot saved as like-fix-test.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikeFix();