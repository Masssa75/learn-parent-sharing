const { execSync } = require('child_process');
const fs = require('fs');

async function createGitHubRepo() {
  console.log('Creating GitHub repository...');
  
  try {
    // Check if we're in a git repo
    try {
      execSync('git status', { stdio: 'pipe' });
    } catch (error) {
      console.error('Not in a git repository!');
      return;
    }
    
    // Try to create repo using gh CLI
    const repoName = 'learn-parent-sharing';
    console.log(`Creating repository: ${repoName}`);
    
    try {
      // First check if gh is available
      execSync('which gh', { stdio: 'pipe' });
      
      // Create the repository
      execSync(`gh repo create ${repoName} --public --source=. --remote=origin --push`, {
        stdio: 'inherit'
      });
      
      console.log('✓ Repository created successfully!');
      console.log(`URL: https://github.com/$(gh api user --jq .login)/${repoName}`);
      
    } catch (error) {
      console.log('GitHub CLI not available or repo already exists');
      console.log('Trying to add remote manually...');
      
      try {
        execSync('git remote add origin https://github.com/marcschwyn/learn-parent-sharing.git');
        execSync('git branch -M main');
        execSync('git push -u origin main', { stdio: 'inherit' });
        console.log('✓ Code pushed to GitHub!');
      } catch (pushError) {
        console.error('Failed to push:', pushError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createGitHubRepo();