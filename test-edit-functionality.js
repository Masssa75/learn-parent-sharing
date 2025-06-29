const { chromium } = require('playwright');
require('dotenv').config();

async function testEditFunctionality() {
  console.log('🧪 Testing post edit functionality...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login as devtest user
    console.log('1️⃣ Logging in as devtest user...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await page.fill('input[type="password"]', process.env.DEV_LOGIN_PASSWORD);
    await page.click('button:has-text("devtest")');
    
    // Wait for redirect
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    console.log('✅ Logged in successfully\n');

    // Step 2: Wait for posts to load
    console.log('2️⃣ Waiting for posts to load...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if any posts are visible
    const posts = await page.$$('h2.text-title-lg');
    if (posts.length === 0) {
      console.log('⚠️ No posts found in feed');
      await browser.close();
      return;
    }
    console.log(`✅ Found ${posts.length} posts\n`);

    // Step 3: Look for EDIT button on posts
    console.log('3️⃣ Looking for EDIT buttons...');
    const editButtons = await page.$$('button:has-text("EDIT")');
    
    if (editButtons.length === 0) {
      console.log('⚠️ No EDIT buttons found. This means either:');
      console.log('   - The logged-in user doesn\'t own any posts');
      console.log('   - The edit functionality is not working');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'no-edit-buttons.png', fullPage: true });
      console.log('📸 Screenshot saved as no-edit-buttons.png');
    } else {
      console.log(`✅ Found ${editButtons.length} EDIT buttons\n`);
      
      // Step 4: Click the first EDIT button
      console.log('4️⃣ Clicking the first EDIT button...');
      await editButtons[0].click();
      
      // Wait for edit form to appear
      await page.waitForSelector('input[placeholder="Title"]', { timeout: 5000 });
      console.log('✅ Edit form appeared\n');
      
      // Step 5: Modify the post
      console.log('5️⃣ Modifying post content...');
      const titleInput = await page.$('input[placeholder="Title"]');
      const descInput = await page.$('textarea[placeholder="Description"]');
      
      // Get current values
      const currentTitle = await titleInput.inputValue();
      const currentDesc = await descInput.inputValue();
      
      console.log(`Current title: "${currentTitle}"`);
      console.log(`Current description: "${currentDesc}"`);
      
      // Update with new values
      const newTitle = currentTitle + ' (Edited)';
      const newDesc = currentDesc + '\n\nEdited via test script.';
      
      await titleInput.fill(newTitle);
      await descInput.fill(newDesc);
      
      console.log(`New title: "${newTitle}"`);
      console.log(`New description: "${newDesc}"\n`);
      
      // Step 6: Save the changes
      console.log('6️⃣ Saving changes...');
      await page.click('button:has-text("SAVE")');
      
      // Wait for the edit form to disappear
      await page.waitForSelector('input[placeholder="Title"]', { state: 'hidden', timeout: 5000 });
      console.log('✅ Edit form closed\n');
      
      // Step 7: Verify the changes
      console.log('7️⃣ Verifying changes...');
      await page.waitForTimeout(1000); // Give it a moment to update
      
      // Find the edited post title
      const updatedTitle = await page.textContent('h2.text-title-lg');
      if (updatedTitle && updatedTitle.includes('(Edited)')) {
        console.log('✅ Post successfully edited!');
        console.log(`   Updated title: "${updatedTitle}"`);
      } else {
        console.log('❌ Edit may have failed - title not updated');
      }
      
      // Take a screenshot of the result
      await page.screenshot({ path: 'edit-result.png', fullPage: true });
      console.log('\n📸 Screenshot saved as edit-result.png');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    console.log('\n🏁 Test completed');
    await browser.close();
  }
}

// Run the test
testEditFunctionality().catch(console.error);