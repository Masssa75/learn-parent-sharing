const { chromium } = require('playwright');
require('dotenv').config();

async function createTestPost() {
  console.log('🧪 Creating a test post...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
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

    // Step 2: Navigate to create page
    console.log('2️⃣ Navigating to create page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/create');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ On create page\n');

    // Step 3: Click "Write with AI" button to switch to manual mode
    console.log('3️⃣ Switching to manual write mode...');
    await page.click('button:has-text("Write")');
    await page.waitForTimeout(500);
    console.log('✅ In write mode\n');

    // Step 4: Fill in the form
    console.log('4️⃣ Filling in post details...');
    
    // Title
    await page.fill('input[placeholder="What made parenting easier today?"]', 'Test Post for Edit Functionality');
    
    // Description
    await page.fill('textarea[placeholder="Tell other parents about your experience..."]', 'This is a test post created to verify the edit functionality. It will be edited shortly.');
    
    // Link (optional)
    await page.fill('input[placeholder="Paste link to app, video, or website"]', 'https://example.com/test');
    
    // Category
    await page.selectOption('select', 'Apps & Software');
    
    // Age range
    await page.click('button:has-text("0-2 years")');
    
    console.log('✅ Form filled\n');

    // Step 5: Submit the post
    console.log('5️⃣ Submitting post...');
    await page.click('button:has-text("Share")');
    
    // Wait for redirect back to home
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    console.log('✅ Post created successfully!\n');

    // Step 6: Verify the post appears
    console.log('6️⃣ Verifying post appears in feed...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const postTitle = await page.textContent('h2:has-text("Test Post for Edit Functionality")');
    if (postTitle) {
      console.log('✅ Post confirmed in feed!');
      console.log(`   Title: "${postTitle}"`);
      
      // Look for the EDIT button
      const editButton = await page.$('button:has-text("EDIT")');
      if (editButton) {
        console.log('✅ EDIT button is visible on the post');
      } else {
        console.log('⚠️ EDIT button not found - checking if it\'s the user\'s post...');
      }
    } else {
      console.log('❌ Post not found in feed');
    }

    // Take a screenshot
    await page.screenshot({ path: 'post-created.png', fullPage: true });
    console.log('\n📸 Screenshot saved as post-created.png');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'create-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as create-error.png');
  } finally {
    console.log('\n🏁 Post creation completed');
    await browser.close();
  }
}

// Run the test
createTestPost().catch(console.error);