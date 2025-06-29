const { chromium } = require('playwright');

async function testPointsSystem() {
  console.log('Testing Points System...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage()
  
  try {
    // 1. Login as test user
    console.log('1. Logging in as test user...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as usertest")');
    
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    console.log('✅ Logged in successfully');
    
    // 2. Check if points display is visible
    console.log('\n2. Looking for points display...');
    await page.waitForTimeout(2000); // Give time for components to load
    
    // Take screenshot of current state
    await page.screenshot({ path: 'points-system-initial.png' });
    
    // Look for points display elements
    const levelBadge = await page.locator('.bg-primary.rounded-full').first();
    const pointsText = await page.locator('text=/points this week/').first();
    
    if (await levelBadge.isVisible()) {
      console.log('✅ Level badge is visible');
      const levelText = await levelBadge.textContent();
      console.log(`   Current level: ${levelText}`);
    } else {
      console.log('❌ Level badge not found');
    }
    
    if (await pointsText.isVisible()) {
      console.log('✅ Points display is visible');
      const pointsContainer = await page.locator('.text-2xl.font-bold.text-primary').first();
      const points = await pointsContainer.textContent();
      console.log(`   Current points: ${points}`);
    } else {
      console.log('❌ Points display not found');
    }
    
    // 3. Test earning points by liking a post
    console.log('\n3. Testing points earning by liking a post...');
    
    // Find the first like button
    const likeButton = await page.locator('button:has-text("Like")').first();
    if (await likeButton.isVisible()) {
      console.log('Found a like button, clicking it...');
      await likeButton.click();
      
      // Wait for potential animation
      await page.waitForTimeout(2000);
      
      // Check if points increased
      const newPointsContainer = await page.locator('.text-2xl.font-bold.text-primary').first();
      const newPoints = await newPointsContainer.textContent();
      console.log(`   Points after like: ${newPoints}`);
      
      // Take screenshot after action
      await page.screenshot({ path: 'points-system-after-like.png' });
    } else {
      console.log('❌ No like button found');
    }
    
    // 4. Test saving a post
    console.log('\n4. Testing points earning by saving a post...');
    
    const saveButton = await page.locator('button:has-text("Share")').first();
    if (await saveButton.isVisible()) {
      console.log('Found a save button, clicking it...');
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      const finalPointsContainer = await page.locator('.text-2xl.font-bold.text-primary').first();
      const finalPoints = await finalPointsContainer.textContent();
      console.log(`   Points after save: ${finalPoints}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'points-system-final.png' });
    }
    
    // 5. Check actions remaining
    console.log('\n5. Checking actions remaining...');
    const actionsText = await page.locator('text=/actions left/').first();
    if (await actionsText.isVisible()) {
      const actionsContainer = await page.locator('.text-2xl.font-bold.text-text-secondary').first();
      const actions = await actionsContainer.textContent();
      console.log(`✅ Actions remaining: ${actions}`);
    } else {
      console.log('❌ Actions remaining display not found');
    }
    
    console.log('\n🎉 Points system test completed!');
    console.log('Screenshots saved:');
    console.log('- points-system-initial.png');
    console.log('- points-system-after-like.png');
    console.log('- points-system-final.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'points-system-error.png' });
  } finally {
    console.log('\n👀 Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close when done.');
  }
}

testPointsSystem();