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
    
    // 2. Wait for posts and auth to complete
    await page.waitForTimeout(5000);
    
    // 3. Get all posts with like buttons
    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll('.mb-6');
      return Array.from(postElements).map(post => {
        const title = post.querySelector('h2')?.textContent || '';
        const buttons = post.querySelectorAll('button');
        let likeButton = null;
        
        // Find the like button by checking text content
        for (const btn of buttons) {
          if (btn.textContent?.includes('Like') || btn.textContent?.match(/^\d+$/)) {
            likeButton = btn;
            break;
          }
        }
        
        if (likeButton) {
          return {
            title: title.substring(0, 50),
            isYellow: likeButton.classList.contains('text-brand-yellow'),
            buttonText: likeButton.textContent?.trim(),
            svgFill: likeButton.querySelector('svg')?.getAttribute('fill')
          };
        }
        return null;
      }).filter(Boolean);
    });
    
    console.log('\n2. Posts found:');
    posts.forEach((post, i) => {
      console.log(`   ${i+1}. "${post.title}"`);
      console.log(`      Button: ${post.isYellow ? '❤️ YELLOW' : '🤍 NOT YELLOW'} (${post.buttonText})`);
    });
    
    // 4. Check BEST TV Series (should be liked from our DB check)
    const tvPost = posts.find(p => p.title.includes('BEST TV Series'));
    if (tvPost) {
      console.log(`\n3. "BEST TV Series" is ${tvPost.isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
      if (!tvPost.isYellow) {
        console.log('   ⚠️  This post should be yellow based on DB!');
      }
    }
    
    // 5. Find first not-yellow post
    const unlikedPost = posts.find(p => !p.isYellow);
    if (unlikedPost) {
      console.log(`\n4. Found unliked post: "${unlikedPost.title}"`);
      
      // Find and click it
      const postEl = await page.$(`h2:text("${unlikedPost.title.substring(0, 30)}")`);
      if (postEl) {
        const container = await postEl.$('xpath=ancestor::div[contains(@class, "mb-6")]');
        const likeBtn = await container.$('button >> text=/Like|^\\d+$/');
        
        if (likeBtn) {
          console.log('   Clicking like button...');
          await likeBtn.click();
          await page.waitForTimeout(2000);
          
          // Check if it turned yellow
          const isNowYellow = await likeBtn.evaluate(btn => 
            btn.classList.contains('text-brand-yellow')
          );
          console.log(`   Button is now: ${isNowYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
          
          // 6. Refresh page
          console.log('\n5. Refreshing page...');
          await page.reload();
          await page.waitForTimeout(5000);
          
          // 7. Find the same post again
          const postElAfter = await page.$(`h2:text("${unlikedPost.title.substring(0, 30)}")`);
          if (postElAfter) {
            const containerAfter = await postElAfter.$('xpath=ancestor::div[contains(@class, "mb-6")]');
            const likeBtnAfter = await containerAfter.$('button >> text=/Like|^\\d+$/');
            
            if (likeBtnAfter) {
              const isStillYellow = await likeBtnAfter.evaluate(btn => 
                btn.classList.contains('text-brand-yellow')
              );
              
              console.log(`\n6. After refresh: "${unlikedPost.title.substring(0, 40)}..."`);
              console.log(`   Button is: ${isStillYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
              
              if (isStillYellow) {
                console.log('\n✅ SUCCESS: Like persistence is working!');
              } else {
                console.log('\n❌ BUG STILL EXISTS: Like not persisting after refresh');
              }
            }
          }
        }
      }
    } else {
      console.log('\n4. All posts are already liked!');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'like-persistence-test.png' });
    console.log('\n7. Screenshot saved');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikeFix();