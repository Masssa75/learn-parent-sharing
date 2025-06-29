const { chromium } = require('playwright');

async function testFileLockSystem() {
  console.log('Testing File Lock System...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Go to test auth page
    console.log('1. Logging in as admin...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    // Enter password
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    // Click admintest button
    await page.click('button:has-text("Login as admintest")');
    
    // Wait for redirect
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    console.log('✅ Logged in successfully');
    
    // 2. Navigate to admin page
    console.log('\n2. Navigating to admin dashboard...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/admin');
    
    // Wait for admin page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")');
    console.log('✅ Admin dashboard loaded');
    
    // 3. Click on File Locks tab
    console.log('\n3. Clicking File Locks tab...');
    await page.click('button:has-text("File Locks")');
    
    // Wait for file lock manager to load
    await page.waitForSelector('h2:has-text("File Lock Manager")', { timeout: 10000 });
    console.log('✅ File Locks tab loaded');
    
    // 4. Check if table exists or if we see the creation message
    const errorMessage = await page.locator('.bg-yellow-50').count();
    if (errorMessage > 0) {
      console.log('❌ File locks table not created - showing SQL instructions');
      await page.screenshot({ path: 'file-locks-not-created.png' });
    } else {
      console.log('✅ File locks table exists');
      
      // 5. Try to create a new lock
      console.log('\n4. Creating a new file lock...');
      await page.click('button:has-text("Lock File")');
      
      // Fill in lock details
      await page.fill('input[placeholder*="File path"]', '/app/components/Header.tsx');
      await page.fill('input[placeholder*="Locked by"]', 'Claude-Test-Instance-1');
      await page.fill('input[placeholder*="Description"]', 'Testing file lock system with Playwright');
      
      // Select 30 minutes duration
      await page.selectOption('select', '30');
      
      // Click Create Lock
      await page.click('button:has-text("Create Lock")');
      
      // Wait for lock to appear
      await page.waitForSelector('.font-mono:has-text("/app/components/Header.tsx")', { timeout: 5000 });
      console.log('✅ File lock created successfully!');
      
      // Take screenshot
      await page.screenshot({ path: 'file-lock-created.png' });
      
      // 6. Check lock details
      const lockElement = await page.locator('.border.rounded.p-4').first();
      const lockText = await lockElement.textContent();
      console.log('\n📋 Lock Details:');
      console.log(lockText);
      
      // 7. Try to create duplicate lock (should fail)
      console.log('\n5. Testing duplicate lock prevention...');
      await page.click('button:has-text("Lock File")');
      await page.fill('input[placeholder*="File path"]', '/app/components/Header.tsx');
      await page.fill('input[placeholder*="Locked by"]', 'Claude-Test-Instance-2');
      await page.click('button:has-text("Create Lock")');
      
      // Check for error alert
      page.on('dialog', async dialog => {
        console.log('✅ Duplicate lock prevented:', dialog.message());
        await dialog.accept();
      });
      
      await page.waitForTimeout(2000);
      
      // 8. Release the lock
      console.log('\n6. Releasing the lock...');
      await page.click('button:has-text("Release Lock")');
      
      // Confirm deletion
      page.on('dialog', async dialog => {
        if (dialog.message().includes('Are you sure')) {
          console.log('Confirming lock release...');
          await dialog.accept();
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Check if lock is gone
      const remainingLocks = await page.locator('.font-mono:has-text("/app/components/Header.tsx")').count();
      if (remainingLocks === 0) {
        console.log('✅ Lock released successfully!');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'file-locks-final-state.png' });
    
    console.log('\n🎉 File lock system test completed!');
    console.log('Screenshots saved:');
    console.log('- file-lock-created.png');
    console.log('- file-locks-final-state.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'file-lock-error.png' });
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close when done.');
  }
}

testFileLockSystem();