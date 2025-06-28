const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = 'sbp_6f04b779bfc9e9fb52600595aabdfb3545a84add';
const PROJECT_ID = 'yvzinotrjggncbwflxok';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_ID}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Executing database schema via Supabase Management API...');
  
  try {
    // First, ensure uuid extension is enabled
    console.log('Enabling uuid-ossp extension...');
    try {
      await executeSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✅ UUID extension enabled');
    } catch (e) {
      console.log('UUID extension might already be enabled');
    }

    // Read and parse schema file properly
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const fullSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one transaction
    const wrappedSchema = `
BEGIN;

${fullSchema}

COMMIT;
    `;
    
    console.log('Executing full schema in transaction...');
    try {
      const result = await executeSQL(wrappedSchema);
      console.log('✅ Schema executed successfully!');
      return;
    } catch (error) {
      console.log('Transaction failed, executing statements individually...');
    }
    
    // If transaction fails, execute key statements individually
    const criticalStatements = [
      // Create tables first
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        telegram_id BIGINT UNIQUE NOT NULL,
        telegram_username TEXT,
        first_name TEXT,
        last_name TEXT,
        photo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        kids_ages TEXT[],
        interests TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        emoji TEXT,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `INSERT INTO categories (name, emoji, slug) VALUES
        ('Apps & Software', '📱', 'apps'),
        ('Toys & Games', '🧸', 'toys'),
        ('Books', '📚', 'books'),
        ('Educational Resources', '🎓', 'education'),
        ('Activities', '🎨', 'activities'),
        ('Parenting Tips', '💡', 'tips')
      ON CONFLICT DO NOTHING`,
      
      `CREATE TABLE IF NOT EXISTS age_ranges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        range TEXT UNIQUE NOT NULL,
        min_age INTEGER,
        max_age INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `INSERT INTO age_ranges (range, min_age, max_age) VALUES
        ('0-2', 0, 2),
        ('3-4', 3, 4),
        ('5-7', 5, 7),
        ('8-10', 8, 10),
        ('11-13', 11, 13),
        ('14+', 14, 99)
      ON CONFLICT DO NOTHING`,
      
      `CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category_id UUID REFERENCES categories(id),
        age_ranges TEXT[],
        image_url TEXT,
        link_url TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS likes (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, post_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS saved_posts (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, post_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS telegram_connections (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        chat_id BIGINT NOT NULL,
        notifications_enabled BOOLEAN DEFAULT true,
        notification_types TEXT[] DEFAULT ARRAY['likes', 'comments', 'new_posts'],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];
    
    let success = 0, failed = 0;
    
    for (let i = 0; i < criticalStatements.length; i++) {
      const stmt = criticalStatements[i];
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ') + '...';
      console.log(`\n[${i+1}/${criticalStatements.length}] ${preview}`);
      
      try {
        await executeSQL(stmt + ';');
        console.log('✅ Success');
        success++;
      } catch (err) {
        console.log(`❌ Failed: ${err.message.substring(0, 100)}`);
        failed++;
      }
    }
    
    console.log(`\n✅ Schema execution completed: ${success} successful, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n🎉 All tables created successfully!');
      console.log('\nNote: Indexes, triggers, and RLS policies may need to be added manually.');
      console.log(`Visit: https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();