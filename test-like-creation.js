const { chromium } = require('playwright');

async function testLikeCreation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable detailed console logging
  page.on('console', msg => console.log('Browser:', msg.text()));
  
  // Monitor network requests
  page.on('response', response => {
    if (response.url().includes('/api/actions')) {
      console.log(`\nAPI Response: ${response.status()} ${response.url()}`);
      response.json().then(data => {
        console.log('Response data:', JSON.stringify(data, null, 2));
      }).catch(() => {});
    }
  });

  try {
    // 1. Login
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    // 2. Wait for posts
    await page.waitForTimeout(5000);
    
    // 3. Click the first like button
    console.log('\n2. Finding first like button...');
    const firstLikeButton = await page.$('button:has(svg path[d*="M20.84 4.61"]):first-of-type');
    
    if (firstLikeButton) {
      const postInfo = await firstLikeButton.evaluate(btn => {
        let parent = btn.parentElement;
        while (parent && !parent.querySelector('h2')) {
          parent = parent.parentElement;
        }
        return {
          title: parent?.querySelector('h2')?.textContent || 'Unknown',
          currentText: btn.textContent
        };
      });
      
      console.log(`   Found post: "${postInfo.title.substring(0, 40)}..."`);
      console.log(`   Button text: "${postInfo.currentText}"`);
      
      console.log('\n3. Clicking like button...');
      await firstLikeButton.click();
      
      // Wait for API response
      await page.waitForTimeout(3000);
      
      // Check if button changed
      const afterClick = await firstLikeButton.evaluate(btn => ({
        isYellow: btn.classList.contains('text-brand-yellow'),
        text: btn.textContent
      }));
      
      console.log('\n4. After clicking:');
      console.log(`   Button is yellow: ${afterClick.isYellow}`);
      console.log(`   Button text: "${afterClick.text}"`);
    }
    
    console.log('\n5. Waiting to observe any errors...');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nTest complete.');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testLikeCreation();