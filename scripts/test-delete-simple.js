const { chromium } = require('playwright');

async function testDelete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  try {
    console.log('1. Going to test auth...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Clicking admintest button...');
    await page.click('button:has-text("Login as admintest")');
    
    console.log('3. Waiting for success message...');
    await page.waitForSelector('text=Success! Logged in as admintest', { timeout: 5000 });
    
    console.log('4. Waiting for redirect (2 second delay + navigation)...');
    await page.waitForTimeout(2500);
    
    // If still on test-auth, manually navigate
    if (page.url().includes('test-auth')) {
      console.log('Still on test-auth, navigating to home...');
      await page.goto('https://learn-parent-sharing-app.netlify.app/');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('5. Current URL:', page.url());
    
    console.log('6. Looking for delete buttons...');
    const deleteButtons = await page.$$('button:has-text("DELETE")');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      console.log('✅ Admin delete buttons are visible!');
      
      // Test deleting a post
      console.log('7. Clicking first delete button...');
      
      page.once('dialog', dialog => {
        console.log('Confirmation dialog appeared:', dialog.message());
        dialog.accept();
      });
      
      await deleteButtons[0].click();
      await page.waitForTimeout(2000);
      
      console.log('8. Checking if post was deleted...');
      const deleteButtonsAfter = await page.$$('button:has-text("DELETE")');
      if (deleteButtonsAfter.length < deleteButtons.length) {
        console.log('✅ Post was successfully deleted!');
      } else {
        console.log('❌ Post was not deleted');
      }
    } else {
      console.log('❌ No delete buttons found - checking if logged in as admin...');
      
      // Try to click profile button
      const profileButtons = await page.$$('button[title]');
      if (profileButtons.length > 0) {
        await profileButtons[0].click();
        await page.waitForTimeout(500);
        
        const adminLink = await page.$('text=Admin Dashboard');
        if (adminLink) {
          console.log('✅ User is admin (Admin Dashboard link visible)');
        } else {
          console.log('❌ User is not admin');
        }
      }
    }
    
    await page.screenshot({ path: 'delete-test-result.png', fullPage: true });
    console.log('\nScreenshot saved as delete-test-result.png');
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'delete-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testDelete();