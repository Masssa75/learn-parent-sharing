const { chromium } = require('playwright');

async function checkLikesState() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('DEBUG:') || text.includes('Error')) {
      console.log('Browser:', text);
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
    
    // 3. Analyze all like buttons
    const likeButtonsInfo = await page.$$eval('button:has(svg):has-text("Like")', buttons => 
      buttons.map(btn => {
        const svg = btn.querySelector('svg');
        const post = btn.closest('[class*="rounded-card"]');
        const title = post?.querySelector('h2')?.textContent || 'Unknown';
        
        return {
          title: title.substring(0, 30) + '...',
          isYellow: btn.classList.contains('text-brand-yellow'),
          isFilled: svg?.getAttribute('fill') === 'currentColor',
          isDisabled: btn.disabled,
          likeCount: btn.textContent.replace('Like', '').trim() || '0'
        };
      })
    );
    
    console.log('\n2. Current state of all like buttons:');
    likeButtonsInfo.forEach((info, i) => {
      console.log(`   Post ${i + 1}: "${info.title}"`);
      console.log(`     - Yellow: ${info.isYellow}, Filled: ${info.isFilled}, Disabled: ${info.isDisabled}, Count: ${info.likeCount}`);
    });
    
    // 4. Try to find a post that shows as not liked (no yellow, not filled)
    const notLikedButton = await page.$('button:not(.text-brand-yellow):has(svg[fill="none"]):has-text("Like")');
    
    if (notLikedButton) {
      console.log('\n3. Found a post that appears not liked, clicking it...');
      const beforeClick = await notLikedButton.textContent();
      await notLikedButton.click();
      await page.waitForTimeout(2000);
      
      const afterClick = await notLikedButton.textContent();
      console.log(`   Before: "${beforeClick}", After: "${afterClick}"`);
      
      // Check for any error messages
      const alerts = await page.$$eval('body', () => {
        const text = document.body.textContent || '';
        return text.includes('already liked') || text.includes('Rate limit');
      });
      console.log(`   Any error messages: ${alerts}`);
    } else {
      console.log('\n3. No unliked buttons found (all appear yellow/filled)');
    }
    
    // 5. Take a screenshot
    await page.screenshot({ path: 'likes-state.png', fullPage: false });
    console.log('\n4. Screenshot saved as likes-state.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkLikesState();