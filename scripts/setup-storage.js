const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupStorage() {
  try {
    console.log('Setting up Supabase Storage...')
    
    // Create the post-images bucket
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('post-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ post-images bucket already exists')
      } else {
        console.error('❌ Error creating bucket:', bucketError)
        return
      }
    } else {
      console.log('✅ post-images bucket created successfully')
    }
    
    // Test bucket access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    const postImagesBucket = buckets.find(b => b.name === 'post-images')
    if (postImagesBucket) {
      console.log('✅ post-images bucket is accessible:', {
        name: postImagesBucket.name,
        public: postImagesBucket.public,
        created_at: postImagesBucket.created_at
      })
    } else {
      console.log('❌ post-images bucket not found in bucket list')
    }
    
    console.log('\n🎉 Storage setup completed!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupStorage()