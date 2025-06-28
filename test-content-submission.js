const { chromium } = require('playwright');
require('dotenv').config();

const SITE_URL = 'https://learn-parent-sharing-app.netlify.app';
const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD;

async function testContentSubmission() {
  console.log('🧪 Testing content submission flow...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Login as test user
    console.log('1️⃣ Logging in as test user...');
    await page.goto(`${SITE_URL}/test-auth`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="password"]', DEV_PASSWORD);
    await page.click('button:has-text("Login as Dev Test User")');
    
    // Wait for redirect to feed
    await page.waitForURL(`${SITE_URL}/feed`, { timeout: 10000 });
    console.log('✅ Logged in successfully!\n');
    
    // 2. Navigate to create page
    console.log('2️⃣ Navigating to create page...');
    // Wait for feed page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra wait for dynamic content
    
    // Click the floating action button (FAB) with the + sign
    await page.click('button:has-text("+")');
    await page.waitForURL(`${SITE_URL}/create`);
    console.log('✅ On create page\n');
    
    // 3. Fill out the form
    console.log('3️⃣ Filling out post form...');
    const timestamp = new Date().toISOString();
    const testPost = {
      title: `Test Post ${timestamp}`,
      url: 'https://example.com/test-app',
      description: 'This is a test post created via automated testing',
      category: 'app',
      ageRange: '5-7'
    };
    
    await page.fill('input[placeholder="What made parenting easier today?"]', testPost.title);
    await page.fill('input[type="url"]', testPost.url);
    await page.fill('textarea[placeholder="Tell other parents about your experience..."]', testPost.description);
    
    // Select category
    const categorySelect = await page.locator('select').first();
    await categorySelect.selectOption(testPost.category);
    
    // Select age range
    const ageRangeSelect = await page.locator('select').nth(1);
    await ageRangeSelect.selectOption(testPost.ageRange);
    
    console.log('✅ Form filled out\n');
    
    // 4. Submit the form
    console.log('4️⃣ Submitting post...');
    
    // Set up console logging to see any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Click the Share button
    await page.click('button:has-text("Share"):not(:has-text("Cancel"))');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(2000);
    
    // Check current URL
    console.log('Current URL after submit:', page.url());
    
    // Check for any error messages
    const errorElement = await page.locator('.text-red-500').first();
    if (await errorElement.count() > 0) {
      const errorText = await errorElement.textContent();
      console.log('Error found:', errorText);
    }
    
    // Try to wait for navigation
    try {
      await page.waitForURL(`${SITE_URL}/feed`, { timeout: 5000 });
    } catch (e) {
      console.log('Navigation timeout - checking if still on create page');
    }
    
    // Check if we're back on feed/homepage (success) or still on create page (error)
    if (page.url() === `${SITE_URL}/feed` || page.url() === SITE_URL) {
      console.log('✅ Post submitted successfully!\n');
      
      // 5. Verify post appears in feed
      console.log('5️⃣ Checking if post appears in feed...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const postTitle = await page.locator(`text="${testPost.title}"`).first();
      if (await postTitle.isVisible()) {
        console.log('✅ Post found in feed!\n');
        console.log('🎉 Content submission is working correctly!');
      } else {
        console.log('❌ Post not found in feed\n');
        console.log('⚠️  Post submitted but not visible in feed');
      }
    } else {
      // Check for error message
      const errorElement = await page.locator('.text-red-500').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Error submitting post: ${errorText}\n`);
      } else {
        console.log('❌ Unknown error - still on create page\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Screenshot saved as error-screenshot.png');
  } finally {
    // Take final screenshot of feed
    await page.screenshot({ path: 'final-feed.png' });
    console.log('📸 Final feed screenshot saved as final-feed.png');
    
    // Keep browser open for 5 seconds to see the result
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testContentSubmission().catch(console.error);