const { chromium } = require('playwright');

async function testLikeFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('DEBUG:')) {
      console.log('Browser:', msg.text());
    }
  });

  try {
    // 1. Login
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    console.log('✓ Logged in');
    
    // 2. Wait for posts to load
    await page.waitForTimeout(5000); // Give extra time
    
    // 3. Get all posts info
    const postsInfo = await page.evaluate(() => {
      const posts = Array.from(document.querySelectorAll('.mb-6'));
      return posts.map(post => {
        const title = post.querySelector('h2')?.textContent || 'No title';
        const likeBtn = post.querySelector('button:has-text("Like")');
        const svg = likeBtn?.querySelector('svg');
        return {
          title: title.substring(0, 40),
          hasLikeButton: !!likeBtn,
          isYellow: likeBtn?.classList.contains('text-brand-yellow') || false,
          svgFill: svg?.getAttribute('fill') || 'none',
          likeText: likeBtn?.textContent || ''
        };
      });
    });
    
    console.log('\n2. Found posts:');
    postsInfo.forEach((post, i) => {
      console.log(`   ${i+1}. "${post.title}..."`);
      console.log(`      Like button: ${post.hasLikeButton ? `Yes, ${post.isYellow ? 'YELLOW' : 'NOT YELLOW'}, ${post.likeText}` : 'No'}`);
    });
    
    // 4. Check specifically for BEST TV Series (should be liked)
    const tvPostIndex = postsInfo.findIndex(p => p.title.includes('BEST TV Series'));
    if (tvPostIndex >= 0) {
      const tvPost = postsInfo[tvPostIndex];
      console.log(`\n3. "BEST TV Series" status: ${tvPost.isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
    }
    
    // 5. Find first unliked post
    const unlikedIndex = postsInfo.findIndex(p => p.hasLikeButton && !p.isYellow);
    if (unlikedIndex >= 0) {
      const unlikedPost = postsInfo[unlikedIndex];
      console.log(`\n4. Found unliked post: "${unlikedPost.title}..."`);
      
      // Click it
      const buttons = await page.$$('.mb-6 button:has-text("Like")');
      if (buttons[unlikedIndex]) {
        await buttons[unlikedIndex].click();
        console.log('   ✓ Clicked like button');
        await page.waitForTimeout(2000);
        
        // 6. Refresh
        console.log('\n5. Refreshing page...');
        await page.reload();
        await page.waitForTimeout(5000);
        
        // 7. Check again
        const postsAfter = await page.evaluate(() => {
          const posts = Array.from(document.querySelectorAll('.mb-6'));
          return posts.map(post => {
            const title = post.querySelector('h2')?.textContent || 'No title';
            const likeBtn = post.querySelector('button:has-text("Like")');
            return {
              title: title.substring(0, 40),
              isYellow: likeBtn?.classList.contains('text-brand-yellow') || false
            };
          });
        });
        
        const samePostAfter = postsAfter[unlikedIndex];
        if (samePostAfter) {
          console.log(`\n6. After refresh: "${samePostAfter.title}..." is ${samePostAfter.isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
          
          if (samePostAfter.isYellow) {
            console.log('\n✅ FIXED: Like persistence is now working!');
          } else {
            console.log('\n❌ STILL BROKEN: Like not persisting');
          }
        }
      }
    } else {
      console.log('\n4. All posts are already liked');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testLikeFix();