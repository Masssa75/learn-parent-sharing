import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch posts with user and category information
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
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
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedPosts = posts?.map(post => ({
      id: post.id,
      user: {
        name: post.users?.full_name || post.users?.username || 'Anonymous',
        username: post.users?.username || 'anonymous',
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
      saved: false,
      liked: false,
      linkUrl: post.link_url,
      imageUrl: post.image_url,
      createdAt: post.created_at
    })) || []

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from session
    const sessionData = JSON.parse(sessionCookie.value)
    const userId = sessionData.user.id

    // Get the post data from request body
    const body = await request.json()
    const { title, description, category, ageRanges, linkUrl } = body

    // Validate required fields
    if (!title || !description || !category || !ageRanges || ageRanges.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get category ID from category name
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single()

    if (categoryError || !categoryData) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title,
        description,
        category_id: categoryData.id,
        age_ranges: ageRanges,
        link_url: linkUrl || null,
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}