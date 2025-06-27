const { chromium } = require('playwright');

async function testTelegramLogin() {
  console.log('🧪 Testing Telegram login widget...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Load the login page
    console.log('1. Loading login page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/login', {
      waitUntil: 'networkidle'
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-page-screenshot.png' });
    console.log('   Screenshot saved: login-page-screenshot.png');
    
    // Test 2: Check if Telegram widget script is injected
    console.log('\n2. Checking for Telegram widget script...');
    const hasScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script => script.src.includes('telegram-widget.js'));
    });
    console.log(`   Widget script injected: ${hasScript ? '✅' : '❌'}`);
    
    // Test 3: Wait for widget to load and check for iframe
    console.log('\n3. Waiting for Telegram widget iframe...');
    try {
      await page.waitForSelector('iframe[src*="telegram.org"]', { timeout: 10000 });
      console.log('   Telegram iframe found: ✅');
      
      // Get iframe details
      const iframeInfo = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="telegram.org"]');
        if (iframe) {
          return {
            src: iframe.src,
            width: iframe.width,
            height: iframe.height,
            visible: iframe.offsetParent !== null
          };
        }
        return null;
      });
      
      if (iframeInfo) {
        console.log('   iframe details:', iframeInfo);
      }
      
    } catch (error) {
      console.log('   Telegram iframe NOT found: ❌');
      console.log('   Error:', error.message);
    }
    
    // Test 4: Check the HTML content
    console.log('\n4. Checking page content...');
    const bodyText = await page.textContent('body');
    
    if (bodyText.includes('Welcome to Learn')) {
      console.log('   Page title found: ✅');
    }
    
    if (bodyText.includes('Username invalid')) {
      console.log('   ERROR: "Username invalid" message found: ❌');
    }
    
    // Test 5: Check for the actual bot username in the DOM
    console.log('\n5. Checking bot configuration...');
    const pageContent = await page.content();
    
    if (pageContent.includes('learn_notification_bot')) {
      console.log('   Correct bot username found: ✅');
    } else if (pageContent.includes('LearnParentBot')) {
      console.log('   Old bot username found: ❌');
    } else {
      console.log('   No bot username found in page: ❌');
    }
    
    // Test 6: Check React component mounting
    console.log('\n6. Checking React component...');
    const componentMounted = await page.evaluate(() => {
      const telegramDiv = document.querySelector('div[class*="flex justify-center"] > div');
      return telegramDiv && telegramDiv.childElementCount > 0;
    });
    console.log(`   TelegramLogin component rendered: ${componentMounted ? '✅' : '❌'}`);
    
    // Save the final HTML for debugging
    const finalHtml = await page.content();
    require('fs').writeFileSync('login-page-final.html', finalHtml);
    console.log('\n📄 Final HTML saved to: login-page-final.html');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTelegramLogin().catch(console.error);