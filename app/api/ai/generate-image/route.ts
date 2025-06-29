import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { prompt, title, style = 'cartoon' } = await request.json()

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Define style-specific prompts
    const stylePrompts: Record<string, string> = {
      photorealistic: `Create a photorealistic photograph for this parenting tip: "${title}". ${prompt}. Style: Professional photography, natural lighting, realistic human subjects, authentic moments, documentary style. High detail and lifelike quality.`,
      watercolor: `Create a soft watercolor painting for this parenting tip: "${title}". ${prompt}. Style: Gentle watercolor art, flowing colors, soft edges, pastel palette, artistic brushstrokes, dreamy and calming atmosphere.`,
      minimalist: `Create a minimalist illustration for this parenting tip: "${title}". ${prompt}. Style: Simple geometric shapes, limited color palette (2-3 colors), clean lines, lots of white space, modern Scandinavian design aesthetic.`,
      sketch: `Create a pencil sketch for this parenting tip: "${title}". ${prompt}. Style: Hand-drawn pencil sketch, crosshatching, detailed line work, artistic shading, sketchbook quality, black and white with subtle gray tones.`,
      cartoon: `Create a friendly cartoon illustration for this parenting tip: "${title}". ${prompt}. Style: Cheerful cartoon characters, bright colors, rounded shapes, expressive faces, child-friendly and approachable design.`
    }

    // Use the selected style or default to cartoon
    const imagePrompt = stylePrompts[style] || stylePrompts.cartoon

    console.log('Generating image with prompt:', imagePrompt)

    // Use OpenAI's DALL-E 3 model for image generation
    const requestBody = {
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: style === 'photorealistic' ? "hd" : "standard",
      response_format: "b64_json",
      style: style === 'photorealistic' || style === 'minimalist' ? "natural" : "vivid"
    }

    // Create an AbortController with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
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
    console.log('OpenAI API response received')
    
    // Extract the base64 image from OpenAI response
    let imageBase64: string | null = null

    // OpenAI returns data in a different structure
    if (data.data?.[0]?.b64_json) {
      imageBase64 = data.data[0].b64_json
      console.log('Found image data in response')
    }

    if (!imageBase64) {
      console.error('No image data found. Response structure:', {
        data: data.data?.length || 0
      })
      throw new Error('No image data in response')
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, 'base64')

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
      // With OpenAI, we don't have a temporary URL fallback
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