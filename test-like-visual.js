const { chromium } = require('playwright');

async function testLikeVisual() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

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
    
    // 3. Find specific posts and check their like status
    const postTitles = [
      'Kids Learn Touch Typing', // Should NOT be liked (we just removed it)
      'BEST TV Series for Young Kids' // Should be liked
    ];
    
    for (const titlePart of postTitles) {
      const postElement = await page.$(`h2:has-text("${titlePart}")`);
      if (postElement) {
        const likeButton = await postElement.evaluateHandle(el => 
          el.closest('[class*="rounded-card"]').querySelector('button:has(svg):has-text("Like")')
        );
        
        if (likeButton) {
          const buttonState = await likeButton.evaluate(btn => {
            const svg = btn.querySelector('svg');
            return {
              text: btn.textContent,
              hasYellowClass: btn.classList.contains('text-brand-yellow'),
              svgFill: svg?.getAttribute('fill'),
              disabled: btn.disabled,
              classList: Array.from(btn.classList)
            };
          });
          
          console.log(`\nPost: "${titlePart}"`);
          console.log('  Button state:', JSON.stringify(buttonState, null, 2));
        }
      }
    }
    
    // 4. Take screenshot for visual confirmation
    await page.screenshot({ path: 'like-buttons-visual.png' });
    console.log('\n✓ Screenshot saved as like-buttons-visual.png');
    
    // 5. Now let's like the "Kids Learn Touch Typing" post
    const typingPost = await page.$('h2:has-text("Kids Learn Touch Typing")');
    if (typingPost) {
      const likeBtn = await typingPost.evaluateHandle(el => 
        el.closest('[class*="rounded-card"]').querySelector('button:has(svg):has-text("Like")')
      );
      
      console.log('\n4. Clicking like on "Kids Learn Touch Typing"...');
      await likeBtn.click();
      await page.waitForTimeout(2000);
      
      // Check state after click
      const afterState = await likeBtn.evaluate(btn => ({
        hasYellowClass: btn.classList.contains('text-brand-yellow'),
        svgFill: btn.querySelector('svg')?.getAttribute('fill')
      }));
      console.log('  After click:', afterState);
      
      // 6. Refresh and check if it persists
      console.log('\n5. Refreshing page...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Find the button again
      const typingPostAfter = await page.$('h2:has-text("Kids Learn Touch Typing")');
      if (typingPostAfter) {
        const likeBtnAfter = await typingPostAfter.evaluateHandle(el => 
          el.closest('[class*="rounded-card"]').querySelector('button:has(svg):has-text("Like")')
        );
        
        const persistedState = await likeBtnAfter.evaluate(btn => ({
          hasYellowClass: btn.classList.contains('text-brand-yellow'),
          svgFill: btn.querySelector('svg')?.getAttribute('fill'),
          text: btn.textContent
        }));
        console.log('  After refresh:', persistedState);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testLikeVisual();