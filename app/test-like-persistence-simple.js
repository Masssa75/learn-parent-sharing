const { chromium } = require('playwright');

async function testLikePersistence() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    // 2. Wait for content
    await page.waitForTimeout(3000);
    
    // 3. Check all like buttons
    const buttons = await page.$$eval('button:has-text("Like")', btns => 
      btns.map(b => ({
        title: b.closest('.mb-6')?.querySelector('h2')?.textContent?.substring(0, 30),
        yellow: b.classList.contains('text-brand-yellow'),
        filled: b.querySelector('svg')?.getAttribute('fill') === 'currentColor',
        disabled: b.disabled,
        text: b.textContent
      }))
    );
    
    console.log('\n2. Initial state of like buttons:');
    buttons.forEach((b, i) => {
      console.log(`   ${i+1}. "${b.title}..." - Yellow: ${b.yellow}, Filled: ${b.filled}, Text: ${b.text}`);
    });
    
    // 4. Find the first unliked post
    const unlikedIndex = buttons.findIndex(b => !b.yellow && !b.filled);
    if (unlikedIndex >= 0) {
      console.log(`\n3. Found unliked post at index ${unlikedIndex}: "${buttons[unlikedIndex].title}"`);
      
      // Click it
      const likeButtons = await page.$$('button:has-text("Like")');
      await likeButtons[unlikedIndex].click();
      console.log('   Clicked like button');
      await page.waitForTimeout(2000);
      
      // 5. Refresh
      console.log('\n4. Refreshing page...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      // 6. Check the same button again
      const buttonsAfter = await page.$$eval('button:has-text("Like")', btns => 
        btns.map(b => ({
          title: b.closest('.mb-6')?.querySelector('h2')?.textContent?.substring(0, 30),
          yellow: b.classList.contains('text-brand-yellow'),
          filled: b.querySelector('svg')?.getAttribute('fill') === 'currentColor',
          text: b.textContent
        }))
      );
      
      console.log('\n5. After refresh:');
      const targetPost = buttonsAfter[unlikedIndex];
      if (targetPost) {
        console.log(`   "${targetPost.title}..." - Yellow: ${targetPost.yellow}, Filled: ${targetPost.filled}, Text: ${targetPost.text}`);
        
        if (!targetPost.yellow) {
          console.log('\n   ❌ BUG CONFIRMED: Like button is not yellow after refresh!');
        } else {
          console.log('\n   ✓ Like persisted correctly');
        }
      }
    } else {
      console.log('\n3. All posts are already liked');
    }
    
    await page.screenshot({ path: 'like-state-after-refresh.png' });
    console.log('\n6. Screenshot saved');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikePersistence();