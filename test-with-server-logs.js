const { chromium } = require('playwright');

async function testWithServerLogs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Session') || text.includes('User') || text.includes('liked') || text.includes('First post')) {
      console.log('Browser:', text);
    }
  });

  try {
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    console.log('\n2. Waiting for posts to load with auth...');
    await page.waitForTimeout(5000);
    
    console.log('\n3. Checking like button states...');
    const likeStates = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const svg = btn.querySelector('svg path');
        return svg && svg.getAttribute('d')?.includes('M20.84 4.61');
      });
      
      return buttons.map(btn => {
        let parent = btn.parentElement;
        while (parent && !parent.querySelector('h2')) {
          parent = parent.parentElement;
        }
        return {
          title: parent?.querySelector('h2')?.textContent?.substring(0, 40) || 'Unknown',
          isYellow: btn.classList.contains('text-brand-yellow')
        };
      });
    });
    
    console.log('Like button states:');
    likeStates.forEach((state, i) => {
      console.log(`   ${i+1}. "${state.title}..." - ${state.isYellow ? '❤️ YELLOW' : '🤍 NOT YELLOW'}`);
    });
    
    // Check server logs
    console.log('\n4. Refreshing to see server logs again...');
    await page.reload();
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nDone.');
    await browser.close();
  }
}

testWithServerLogs();