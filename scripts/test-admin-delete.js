const { chromium } = require('playwright');
require('dotenv').config();

async function testAdminDelete() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    
    console.log('2. Logging in as admintest...');
    await page.click('button:has-text("Login as admintest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    
    console.log('3. Checking if user is logged in and admin...');
    await page.waitForTimeout(2000);
    
    // Check if delete buttons are visible
    const deleteButtons = await page.$$('button:has-text("DELETE")');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length === 0) {
      console.log('No delete buttons found - checking if user is admin...');
      
      // Click on profile dropdown to see admin link
      await page.click('button[title]');
      await page.waitForTimeout(500);
      
      const adminLink = await page.$('text=Admin Dashboard');
      if (adminLink) {
        console.log('✅ User is admin (admin link visible)');
      } else {
        console.log('❌ User is not admin or not logged in properly');
      }
      
      // Close dropdown
      await page.keyboard.press('Escape');
    } else {
      console.log('✅ Delete buttons are visible for admin');
      
      // Get the first post title before deletion
      const firstPost = await page.$('.text-title-lg');
      const postTitle = firstPost ? await firstPost.textContent() : 'Unknown';
      console.log(`4. Attempting to delete post: "${postTitle}"`);
      
      // Count posts before deletion
      const postsBefore = await page.$$('.mb-8');
      console.log(`Posts before deletion: ${postsBefore.length}`);
      
      // Click the first delete button
      page.once('dialog', dialog => {
        console.log(`Confirmation dialog: ${dialog.message()}`);
        dialog.accept();
      });
      
      await deleteButtons[0].click();
      
      // Wait for the post to be removed
      await page.waitForTimeout(2000);
      
      // Count posts after deletion
      const postsAfter = await page.$$('.mb-8');
      console.log(`Posts after deletion: ${postsAfter.length}`);
      
      if (postsAfter.length < postsBefore.length) {
        console.log('✅ Post successfully deleted!');
      } else {
        console.log('❌ Post was not deleted');
      }
    }
    
    console.log('\n5. Taking screenshot...');
    await page.screenshot({ path: 'admin-delete-test.png', fullPage: true });
    console.log('Screenshot saved as admin-delete-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'admin-delete-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAdminDelete();