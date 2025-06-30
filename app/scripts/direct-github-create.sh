#!/bin/bash

# Try to create GitHub repo using curl
echo "Attempting to create GitHub repository..."

# First, let's try without auth to see if it works
curl -X POST https://api.github.com/user/repos \
  -H "Accept: application/vnd.github.v3+json" \
  -H "User-Agent: Learn-App" \
  -d '{
    "name": "learn-parent-sharing",
    "description": "Social platform for parents to discover and share apps, toys, and tips for kids",
    "private": false,
    "has_issues": true,
    "has_projects": false,
    "has_wiki": false
  }'

echo -e "\n\nIf the above failed, you'll need to:"
echo "1. Go to https://github.com/new"
echo "2. Create a repository named 'learn-parent-sharing'"
echo "3. Then run: git remote add origin https://github.com/YOUR_USERNAME/learn-parent-sharing.git"
echo "4. And: git push -u origin main"