import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { prompt, title } = await request.json()

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Create a focused prompt for Imagen 3
    const imagePrompt = `Create a clear, helpful illustration for this parenting tip: "${title}". ${prompt}. Style: Clean, modern, family-friendly illustration with soft colors. Show the technique or concept clearly and safely.`

    console.log('Generating image with prompt:', imagePrompt)

    // Use Gemini 2.0 Flash Preview model for faster image generation
    const requestBody = {
      contents: [{
        parts: [{
          text: imagePrompt
        }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        candidateCount: 1
      }
    }

    // Create an AbortController with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.json()
      console.error('Gemini API error:', error)
      console.error('Request body was:', requestBody)
      
      // Provide error information without exposing sensitive details
      return NextResponse.json(
        { 
          error: error.error?.message || 'Failed to generate image',
          details: 'Please check your configuration or try again later'
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Gemini API response structure:', JSON.stringify(data, null, 2))
    
    // Extract the base64 image from Gemini response
    const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (!imageData || !imageData.data) {
      console.error('No image data found. Response structure:', {
        candidates: data.candidates?.length || 0,
        firstCandidate: data.candidates?.[0],
        parts: data.candidates?.[0]?.content?.parts
      })
      throw new Error('No image data in response')
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.data, 'base64')
    const mimeType = imageData.mimeType || 'image/png'

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `generated-images/${timestamp}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}.png`

    // Create the bucket if it doesn't exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === 'post-images')
    
    if (!bucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket('post-images', {
        public: true
      })
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Failed to create bucket:', bucketError)
        // Continue anyway - bucket might exist
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('post-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload to Supabase:', uploadError)
      // No temporary URL available with Gemini
      return NextResponse.json({ 
        error: 'Failed to upload image to storage',
        details: uploadError.message
      }, { status: 500 })
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('post-images')
      .getPublicUrl(filename)

    console.log('Image uploaded successfully:', publicUrl)

    return NextResponse.json({ 
      imageUrl: publicUrl,
      temporary: false
    })
  } catch (error) {
    console.error('Image generation error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Image generation timed out. Please try again.' },
        { status: 504 }
      )
    }
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}