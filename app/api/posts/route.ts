import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { extractYouTubeVideoId } from '@/utils/youtube'
import { toTitleCase } from '@/utils/titleCase'

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use anon key for reading
const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Use service key for writing (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get current user if authenticated
    let currentUserId = null
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('session')
      
      if (sessionCookie) {
        const sessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString()
        )
        currentUserId = sessionData.userId
      }
    } catch (error) {
      // User not authenticated, continue without user-specific data
      console.log('User not authenticated, fetching public posts')
    }
    
    // Fetch posts with user and category information
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users!posts_user_id_fkey (
          id,
          telegram_username,
          first_name,
          last_name,
          photo_url
        ),
        categories (
          id,
          name,
          emoji
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: 'Failed to fetch posts',
        details: error.message 
      }, { status: 500 })
    }

    // If user is authenticated, fetch their likes and saves
    let userLikes = new Set()
    let userSaves = new Set()
    
    if (currentUserId) {
      // Fetch user's likes
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId)
      
      if (likes) {
        userLikes = new Set(likes.map(like => like.post_id))
      }
      
      // Fetch user's saves
      const { data: saves } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', currentUserId)
      
      if (saves) {
        userSaves = new Set(saves.map(save => save.post_id))
      }
    }

    // Transform the data to match the expected format
    const transformedPosts = posts?.map(post => {
      // Extract YouTube video ID from link_url if it's a YouTube link
      let youtubeVideoId = null;
      if (post.link_url) {
        youtubeVideoId = extractYouTubeVideoId(post.link_url);
      }
      
      return {
        id: post.id,
        userId: post.user_id,
        user: {
          name: post.users ? `${post.users.first_name} ${post.users.last_name || ''}`.trim() : 'Anonymous',
          username: post.users?.telegram_username || 'anonymous',
          avatar: post.users?.photo_url || null
        },
        category: {
          name: post.categories?.name || 'Unknown',
          emoji: post.categories?.emoji || '❓'
        },
        title: post.title,
        description: post.description,
        ageRange: post.age_ranges?.join(', ') || '',
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        saved: userSaves.has(post.id),
        liked: userLikes.has(post.id),
        linkUrl: post.link_url,
        youtubeVideoId: youtubeVideoId,
        imageUrl: post.image_url,
        createdAt: post.created_at
      };
    }) || []

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/posts - Starting...')
    
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    console.log('Session cookie:', sessionCookie ? 'Present' : 'Missing')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from session (decode from base64)
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )
    const userId = sessionData.userId
    
    console.log('User ID from session:', userId)

    // Get the post data from request body
    const body = await request.json()
    const { title, description, category, ageRanges, linkUrl, imageUrl } = body
    
    console.log('Post data received:', { title, category, ageRanges: ageRanges?.length })

    // Validate required fields
    if (!title || !description || !category || !ageRanges || ageRanges.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get category ID from category name
    console.log('Looking up category:', category)
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single()

    if (categoryError || !categoryData) {
      console.error('Category lookup failed:', categoryError)
      console.log('Available categories should be checked in the database')
      return NextResponse.json({ 
        error: 'Invalid category', 
        details: categoryError?.message || 'Category not found',
        categorySearched: category 
      }, { status: 400 })
    }
    
    console.log('Category found:', categoryData.id)

    // Create the post using regular client (RLS now allows it)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: toTitleCase(title),
        description,
        category_id: categoryData.id,
        age_ranges: ageRanges,
        link_url: linkUrl || null,
        image_url: imageUrl || null,
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      console.error('Post data attempted:', {
        user_id: userId,
        title,
        description,
        category_id: categoryData.id,
        age_ranges: ageRanges,
        link_url: linkUrl
      })
      return NextResponse.json({ 
        error: 'Failed to create post',
        details: postError.message,
        hint: postError.hint || 'Check if user exists in database'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}