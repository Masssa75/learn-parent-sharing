const { chromium } = require('playwright');

async function testAdminDelete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  try {
    console.log('1. Going to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Entering password...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    console.log('3. Clicking Login as admintest...');
    await page.click('button:has-text("Login as admintest")');
    
    console.log('4. Waiting for success message...');
    try {
      await page.waitForSelector('text=Success! Logged in as admintest', { timeout: 5000 });
      console.log('✅ Login successful!');
      
      // Wait for redirect
      console.log('5. Waiting for redirect...');
      await page.waitForTimeout(2500);
      
    } catch (e) {
      console.log('❌ Login failed or timed out');
      const errorMsg = await page.$('text=Error');
      if (errorMsg) {
        console.log('Error message:', await errorMsg.textContent());
      }
    }
    
    // Navigate to home if still on test-auth
    if (page.url().includes('test-auth')) {
      console.log('6. Manually navigating to home...');
      await page.goto('https://learn-parent-sharing-app.netlify.app/');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('7. Current URL:', page.url());
    
    console.log('8. Looking for delete buttons...');
    await page.waitForTimeout(1000); // Wait for page to fully load
    const deleteButtons = await page.$$('button:has-text("DELETE")');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      console.log('✅ Admin delete buttons are visible!');
      
      // Count posts before deletion
      const postsBefore = await page.$$('.mb-8');
      console.log(`\n9. Posts before deletion: ${postsBefore.length}`);
      
      // Get the title of the first post
      const firstPostTitle = await page.$('.text-title-lg');
      const title = firstPostTitle ? await firstPostTitle.textContent() : 'Unknown';
      console.log(`Post to delete: "${title}"`);
      
      // Setup dialog handler before clicking
      page.once('dialog', dialog => {
        console.log('10. Confirmation dialog:', dialog.message());
        dialog.accept();
      });
      
      console.log('11. Clicking delete button...');
      await deleteButtons[0].click();
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000);
      
      // Count posts after deletion
      const postsAfter = await page.$$('.mb-8');
      console.log(`12. Posts after deletion: ${postsAfter.length}`);
      
      if (postsAfter.length < postsBefore.length) {
        console.log('\n✅ SUCCESS! Post was deleted!');
        console.log(`Deleted ${postsBefore.length - postsAfter.length} post(s)`);
      } else {
        console.log('\n❌ FAILED! Post was not deleted');
      }
    } else {
      console.log('❌ No delete buttons found!');
      console.log('Checking if user is logged in...');
      
      // Check for profile button
      const profileButton = await page.$('button[title]');
      if (profileButton) {
        console.log('Profile button found, clicking to check admin status...');
        await profileButton.click();
        await page.waitForTimeout(500);
        
        const adminLink = await page.$('text=Admin Dashboard');
        if (adminLink) {
          console.log('✅ User is admin (Admin Dashboard link visible)');
        } else {
          console.log('❌ User is not admin or not logged in as admin');
        }
      } else {
        console.log('❌ Not logged in (no profile button found)');
      }
    }
    
    console.log('\n13. Taking final screenshot...');
    await page.screenshot({ path: 'admin-delete-final.png', fullPage: true });
    console.log('Screenshot saved as admin-delete-final.png');
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'admin-delete-error.png' });
  } finally {
    await browser.close();
  }
}

testAdminDelete();