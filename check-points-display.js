const { chromium } = require('playwright');

async function checkPointsDisplay() {
  console.log('Checking points display on live site...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Go directly to home page (no login)
    console.log('1. Going to homepage without login...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForLoadState('networkidle');
    
    // Check if points display exists for non-authenticated users
    const pointsDisplayNoAuth = await page.locator('.bg-dark-background.rounded-card').count();
    console.log(`   Points displays found (no auth): ${pointsDisplayNoAuth}`);
    
    // 2. Login as test user
    console.log('\n2. Logging in as usertest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as usertest")');
    
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForTimeout(3000); // Give time for components to load
    
    // 3. Check points display elements
    console.log('\n3. Checking for points display elements...');
    
    // Look for the hardcoded points display
    const hardcodedDisplay = await page.locator('.flex.items-center.gap-4.p-4.bg-dark-background').first();
    if (await hardcodedDisplay.isVisible()) {
      console.log('✅ Found points display container');
      
      // Check level badge
      const levelBadge = await page.locator('.w-12.h-12.bg-primary.rounded-full').first();
      if (await levelBadge.isVisible()) {
        const level = await levelBadge.textContent();
        console.log(`✅ Level badge visible: Level ${level}`);
      }
      
      // Check points text
      const pointsSpan = await page.locator('span:has-text("points this week")').first();
      if (await pointsSpan.isVisible()) {
        console.log('✅ Points text visible');
      }
      
      // Check actions remaining
      const actionsDiv = await page.locator('div:has-text("actions left")').first();
      if (await actionsDiv.isVisible()) {
        const actionsText = await actionsDiv.textContent();
        console.log(`✅ Actions display visible: ${actionsText.trim()}`);
      }
    } else {
      console.log('❌ Points display not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'points-display-current.png', fullPage: true });
    console.log('\n📸 Screenshot saved: points-display-current.png');
    
    // 4. Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // 5. Check if actions API is working
    console.log('\n4. Checking if Like button triggers action...');
    const likeButton = await page.locator('button:has-text("Like")').first();
    if (await likeButton.isVisible()) {
      console.log('   Found Like button, clicking...');
      
      // Listen for network requests
      const actionPromise = page.waitForResponse(
        resp => resp.url().includes('/api/actions'),
        { timeout: 5000 }
      ).catch(() => null);
      
      await likeButton.click();
      
      const response = await actionPromise;
      if (response) {
        console.log(`✅ Action API called: ${response.status()}`);
        const body = await response.json();
        console.log('   Response:', JSON.stringify(body, null, 2));
      } else {
        console.log('❌ No action API call detected');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'points-display-error.png' });
  } finally {
    console.log('\n👀 Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close when done.');
  }
}

checkPointsDisplay();