const { chromium } = require('playwright');

async function testLikePersistence() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('User') || text.includes('likes') || text.includes('Fetching') || text.includes('Received')) {
      console.log('Browser:', text);
    }
  });

  try {
    // 1. Login
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    console.log('✓ Logged in successfully');
    
    // 2. Wait for posts to fully load
    await page.waitForTimeout(5000);
    
    // 3. Find all like buttons
    const likeButtons = await page.$$eval('button', buttons => {
      return buttons
        .filter(btn => {
          const svg = btn.querySelector('svg path');
          return svg && svg.getAttribute('d')?.includes('M20.84 4.61'); // Heart path
        })
        .map(btn => {
          let parent = btn.parentElement;
          while (parent && !parent.querySelector('h2')) {
            parent = parent.parentElement;
          }
          const title = parent?.querySelector('h2')?.textContent || 'Unknown';
          
          return {
            title: title.substring(0, 40),
            isYellow: btn.classList.contains('text-brand-yellow'),
            text: btn.textContent?.trim()
          };
        });
    });
    
    console.log('\n2. Current like button states:');
    likeButtons.forEach((btn, i) => {
      console.log(`   ${i+1}. "${btn.title}..." - ${btn.isYellow ? '❤️ LIKED' : '🤍 NOT LIKED'} (${btn.text})`);
    });
    
    // 4. Find first unliked post
    const unlikedIndex = likeButtons.findIndex(btn => !btn.isYellow);
    
    if (unlikedIndex >= 0) {
      const targetPost = likeButtons[unlikedIndex];
      console.log(`\n3. Found unliked post: "${targetPost.title}..."`);
      
      // Click the like button
      const allHeartButtons = await page.$$('button:has(svg path[d*="M20.84 4.61"])');
      if (allHeartButtons[unlikedIndex]) {
        console.log('4. Clicking like button...');
        await allHeartButtons[unlikedIndex].click();
        await page.waitForTimeout(2000);
        
        // Check if it turned yellow
        const isNowYellow = await allHeartButtons[unlikedIndex].evaluate(btn => 
          btn.classList.contains('text-brand-yellow')
        );
        console.log(`   Button is now: ${isNowYellow ? '❤️ YELLOW' : '🤍 NOT YELLOW'}`);
        
        // 5. Refresh the page
        console.log('\n5. Refreshing page...');
        await page.reload();
        await page.waitForTimeout(5000);
        
        // 6. Check if like persisted
        const likeButtonsAfterRefresh = await page.$$eval('button', buttons => {
          return buttons
            .filter(btn => {
              const svg = btn.querySelector('svg path');
              return svg && svg.getAttribute('d')?.includes('M20.84 4.61');
            })
            .map(btn => {
              let parent = btn.parentElement;
              while (parent && !parent.querySelector('h2')) {
                parent = parent.parentElement;
              }
              const title = parent?.querySelector('h2')?.textContent || 'Unknown';
              
              return {
                title: title.substring(0, 40),
                isYellow: btn.classList.contains('text-brand-yellow')
              };
            });
        });
        
        const samePostAfterRefresh = likeButtonsAfterRefresh[unlikedIndex];
        if (samePostAfterRefresh) {
          console.log(`\n6. After refresh: "${samePostAfterRefresh.title}..." is ${samePostAfterRefresh.isYellow ? '❤️ LIKED' : '🤍 NOT LIKED'}`);
          
          if (samePostAfterRefresh.isYellow) {
            console.log('\n✅ SUCCESS: Like persistence is now working!');
          } else {
            console.log('\n❌ ISSUE: Like did not persist after refresh');
          }
        }
      }
    } else {
      console.log('\n3. All posts are already liked');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'like-persistence-final-test.png' });
    console.log('\n7. Screenshot saved');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nTest complete.');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikePersistence();