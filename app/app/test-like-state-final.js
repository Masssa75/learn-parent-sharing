const { chromium } = require('playwright');

async function testLikeState() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    // 2. Wait for posts
    await page.waitForTimeout(5000);
    
    // 3. Find all like buttons by looking for heart SVG
    const likeButtonsData = await page.evaluate(() => {
      // Find all buttons that contain the heart SVG path
      const buttons = Array.from(document.querySelectorAll('button'));
      const heartButtons = buttons.filter(btn => {
        const svg = btn.querySelector('svg');
        const path = svg?.querySelector('path');
        return path?.getAttribute('d')?.includes('M20.84 4.61'); // Heart path
      });
      
      return heartButtons.map(btn => {
        // Find the parent post
        let parent = btn.parentElement;
        while (parent && !parent.querySelector('h2')) {
          parent = parent.parentElement;
        }
        const title = parent?.querySelector('h2')?.textContent || 'Unknown';
        
        return {
          title: title.substring(0, 50),
          isYellow: btn.classList.contains('text-brand-yellow'),
          buttonText: btn.textContent?.trim(),
          svgFill: btn.querySelector('svg')?.getAttribute('fill'),
          disabled: btn.disabled
        };
      });
    });
    
    console.log('\n2. Like buttons found:');
    likeButtonsData.forEach((btn, i) => {
      console.log(`   ${i+1}. Post: "${btn.title}"`);
      console.log(`      Status: ${btn.isYellow ? '❤️ YELLOW' : '🤍 NOT YELLOW'} | Text: "${btn.buttonText}" | Fill: ${btn.svgFill}`);
    });
    
    // 4. Check specific posts from our DB query
    const tvPost = likeButtonsData.find(b => b.title.includes('BEST TV Series'));
    if (tvPost) {
      console.log(`\n3. "BEST TV Series" should NOT be liked (we removed it)`);
      console.log(`   Current state: ${tvPost.isYellow ? 'YELLOW ❌ (BUG!)' : 'NOT YELLOW ✓'}`);
    }
    
    const typingPost = likeButtonsData.find(b => b.title.includes('Touch Typing'));
    if (typingPost) {
      console.log(`\n4. "Touch Typing" should be liked`);
      console.log(`   Current state: ${typingPost.isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌ (BUG!)'}`);
    }
    
    // 5. Now test persistence - like the BEST TV Series post
    const tvIndex = likeButtonsData.findIndex(b => b.title.includes('BEST TV Series'));
    if (tvIndex >= 0 && !likeButtonsData[tvIndex].isYellow) {
      console.log('\n5. Clicking like on "BEST TV Series"...');
      
      // Find and click the button
      const heartButtons = await page.$$eval('button', (buttons, targetIndex) => {
        const heartButtons = buttons.filter(btn => {
          const path = btn.querySelector('path');
          return path?.getAttribute('d')?.includes('M20.84 4.61');
        });
        if (heartButtons[targetIndex]) {
          heartButtons[targetIndex].click();
          return true;
        }
        return false;
      }, tvIndex);
      
      if (heartButtons) {
        await page.waitForTimeout(2000);
        
        // Check if it turned yellow
        const isNowYellow = await page.evaluate((index) => {
          const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const path = btn.querySelector('path');
            return path?.getAttribute('d')?.includes('M20.84 4.61');
          });
          return buttons[index]?.classList.contains('text-brand-yellow');
        }, tvIndex);
        
        console.log(`   Button is now: ${isNowYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
        
        // 6. Refresh and check persistence
        console.log('\n6. Refreshing page...');
        await page.reload();
        await page.waitForTimeout(5000);
        
        // Check again
        const afterRefresh = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const heartButtons = buttons.filter(btn => {
            const path = btn.querySelector('path');
            return path?.getAttribute('d')?.includes('M20.84 4.61');
          });
          
          return heartButtons.map(btn => {
            let parent = btn.parentElement;
            while (parent && !parent.querySelector('h2')) {
              parent = parent.parentElement;
            }
            const title = parent?.querySelector('h2')?.textContent || 'Unknown';
            
            return {
              title: title.substring(0, 50),
              isYellow: btn.classList.contains('text-brand-yellow')
            };
          });
        });
        
        const tvAfterRefresh = afterRefresh.find(b => b.title.includes('BEST TV Series'));
        if (tvAfterRefresh) {
          console.log(`\n7. After refresh: "BEST TV Series" is ${tvAfterRefresh.isYellow ? 'YELLOW ✓' : 'NOT YELLOW ❌'}`);
          
          if (tvAfterRefresh.isYellow) {
            console.log('\n✅ SUCCESS: Like persistence is working!');
          } else {
            console.log('\n❌ BUG CONFIRMED: Likes are not persisting after refresh');
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nTest complete.');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikeState();