const https = require('https');

// GitHub personal access token - you'll need to add one
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function createGitHubRepo() {
  const data = JSON.stringify({
    name: 'learn-parent-sharing',
    description: 'Social platform for parents to discover and share apps, toys, and tips for kids',
    private: false,
    has_issues: true,
    has_projects: false,
    has_wiki: false
  });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/user/repos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Learn-App',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(responseData);
      
      if (res.statusCode === 201) {
        console.log('✓ Repository created successfully!');
        console.log(`URL: ${response.html_url}`);
        console.log('\nNow push your code:');
        console.log('git push -u origin main');
      } else if (res.statusCode === 422 && response.errors?.[0]?.message?.includes('already exists')) {
        console.log('Repository already exists!');
        console.log('\nTry pushing your code:');
        console.log('git push -u origin main');
      } else {
        console.error('Failed to create repository:');
        console.error(response);
        console.log('\nYou can create it manually at: https://github.com/new');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

// Check if we have a token
if (!GITHUB_TOKEN) {
  console.log('No GitHub token found.');
  console.log('\nPlease create the repository manually:');
  console.log('1. Go to https://github.com/new');
  console.log('2. Name: learn-parent-sharing');
  console.log('3. Make it public');
  console.log('4. Then run: git push -u origin main');
} else {
  createGitHubRepo();
}