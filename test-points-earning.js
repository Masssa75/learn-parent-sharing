const { chromium } = require('playwright');

async function testPointsEarning() {
  console.log('Testing Points Earning System...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login as test user
    console.log('1. Logging in as devtest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForTimeout(3000); // Give time for components to load
    console.log('✅ Logged in successfully');
    
    // 2. Check initial points display
    console.log('\n2. Checking initial points display...');
    
    const pointsContainer = await page.locator('.text-2xl.font-bold.text-primary').first();
    const initialPoints = await pointsContainer.textContent();
    console.log(`   Initial points: ${initialPoints}`);
    
    const levelBadge = await page.locator('.w-12.h-12.bg-primary.rounded-full').first();
    const level = await levelBadge.textContent();
    console.log(`   Current level: ${level}`);
    
    const actionsText = await page.locator('.text-2xl.font-bold.text-text-secondary').first();
    const actions = await actionsText.textContent();
    console.log(`   Actions remaining: ${actions}`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'points-earning-initial.png' });
    
    // 3. Test earning points by liking a post
    console.log('\n3. Testing points earning by liking a post...');
    
    // Listen for network response
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/actions'),
      { timeout: 10000 }
    );
    
    // Find and click the first like button
    const likeButton = await page.locator('button:has-text("Like")').first();
    console.log('   Clicking Like button...');
    await likeButton.click();
    
    try {
      const response = await responsePromise;
      console.log(`   API Response: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Points earned: ${data.points_earned}`);
        console.log(`   New total points: ${data.user.points}`);
        console.log(`   Actions remaining: ${data.remaining_actions}`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Error: ${error.message || error.error}`);
      }
    } catch (e) {
      console.log('   ❌ No API response received');
    }
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Check updated points
    const newPoints = await pointsContainer.textContent();
    console.log(`   Updated points display: ${newPoints}`);
    
    // Take screenshot after earning points
    await page.screenshot({ path: 'points-earning-after-like.png' });
    
    // 4. Test saving a post
    console.log('\n4. Testing points earning by saving a post...');
    
    const saveResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/actions'),
      { timeout: 10000 }
    );
    
    const saveButton = await page.locator('button:has-text("Share")').nth(1); // Get second one
    console.log('   Clicking Save (Share) button...');
    await saveButton.click();
    
    try {
      const response = await saveResponsePromise;
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Points earned: ${data.points_earned}`);
        console.log(`   New total points: ${data.user.points}`);
      }
    } catch (e) {
      console.log('   ❌ No API response for save action');
    }
    
    await page.waitForTimeout(2000);
    
    // Final points check
    const finalPoints = await pointsContainer.textContent();
    console.log(`\n5. Final points: ${finalPoints}`);
    
    const finalActions = await actionsText.textContent();
    console.log(`   Final actions remaining: ${finalActions}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'points-earning-final.png' });
    
    console.log('\n🎉 Points earning test completed!');
    console.log('Check screenshots for visual confirmation');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'points-earning-error.png' });
  } finally {
    console.log('\n👀 Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close when done.');
  }
}

testPointsEarning();