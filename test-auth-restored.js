const { chromium } = require('playwright');

async function testAuthRestored() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Try to access test-auth page
    console.log('1. Testing if test-auth page is restored...');
    const response = await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    if (response.status() === 404) {
      console.log('❌ test-auth page not found!');
      return;
    }
    
    console.log('✓ test-auth page loaded successfully');
    
    // 2. Try to login
    console.log('\n2. Attempting login...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    
    // Wait for navigation
    try {
      await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
      console.log('✓ Login successful, redirected to homepage');
    } catch (e) {
      console.log('❌ Login failed or redirect didn\'t happen');
      return;
    }
    
    // 3. Wait for posts to load
    await page.waitForTimeout(5000);
    
    // 4. Check if we can see like buttons
    const likeButtons = await page.$$('button:has(svg path[d*="M20.84 4.61"])');
    console.log(`\n3. Found ${likeButtons.length} like buttons`);
    
    if (likeButtons.length > 0) {
      // Check like states
      const states = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
          const path = btn.querySelector('svg path');
          return path && path.getAttribute('d')?.includes('M20.84 4.61');
        });
        
        return buttons.map(btn => {
          let parent = btn.parentElement;
          while (parent && !parent.querySelector('h2')) {
            parent = parent.parentElement;
          }
          return {
            title: parent?.querySelector('h2')?.textContent?.substring(0, 30) || 'Unknown',
            isYellow: btn.classList.contains('text-brand-yellow')
          };
        });
      });
      
      console.log('\n4. Like button states:');
      states.forEach((state, i) => {
        console.log(`   ${i+1}. "${state.title}..." - ${state.isYellow ? '❤️ LIKED' : '🤍 NOT LIKED'}`);
      });
      
      // Try clicking a like if any are not liked
      const unlikedIndex = states.findIndex(s => !s.isYellow);
      if (unlikedIndex >= 0) {
        console.log(`\n5. Clicking like on post ${unlikedIndex + 1}...`);
        await likeButtons[unlikedIndex].click();
        await page.waitForTimeout(2000);
        
        // Refresh to test persistence
        console.log('6. Refreshing page...');
        await page.reload();
        await page.waitForTimeout(5000);
        
        // Check if persisted
        const afterRefresh = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const path = btn.querySelector('svg path');
            return path && path.getAttribute('d')?.includes('M20.84 4.61');
          });
          return buttons.map(btn => btn.classList.contains('text-brand-yellow'));
        });
        
        if (afterRefresh[unlikedIndex]) {
          console.log('\n✅ AUTHENTICATION AND LIKES ARE WORKING!');
        } else {
          console.log('\n⚠️  Authentication works but likes still not persisting');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAuthRestored();