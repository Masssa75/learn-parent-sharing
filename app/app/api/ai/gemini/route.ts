import { NextResponse } from 'next/server'
import { toTitleCase } from '@/utils/titleCase'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function POST(request: Request) {
  try {
    const { transcript, linkUrl } = await request.json()
    
    if (!transcript) {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 })
    }
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }
    
    // Construct the prompt for Gemini
    const prompt = `You are an expert parent content curator helping to create engaging posts for a parenting community platform. 

A parent ${linkUrl ? `wants to share: ${linkUrl}` : 'has a parenting tip or experience to share'}
Their experience: "${transcript}"

Create a compelling post that other parents will find valuable. The title should grab attention and clearly communicate the benefit. The description should expand on why this is helpful for parents.

IMPORTANT: Your response must be valid JSON with these exact fields:
{
  "title": "Engaging title that highlights the key benefit (MAX 60 chars)",
  "description": "Clear explanation of why this helps parents/kids (MAX 200 chars)",
  "category": "Choose ONE: app|toy|video|website|tip",
  "suggestedAge": "Choose ONE: 0-2|3-5|5-7|6-8|8+"
}

Category guidelines:
- "app" for mobile apps, software, digital tools
- "toy" for physical toys, games, books, products
- "video" for YouTube videos, educational content
- "website" for useful websites, online resources
- "tip" for parenting advice, strategies, experiences

Title examples:
- "Khan Academy Kids: Free Learning That Actually Works"
- "The LEGO Set That Kept My 5yo Busy for Hours"
- "Screen-Free Activity That Saved Our Rainy Day"

Make the title specific and benefit-focused. Avoid generic phrases like "Great app" or "Nice toy".`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ error: 'Failed to process with AI' }, { status: 500 })
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }
    
    // Parse the JSON response from Gemini
    try {
      // Extract JSON from the response (Gemini might include extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0])
      
      // Map AI categories to our form categories
      const categoryMap: Record<string, string> = {
        'app': 'apps',
        'toy': 'toys',
        'video': 'education',
        'website': 'apps',
        'tip': 'tips'
      }
      
      return NextResponse.json({
        title: toTitleCase(parsedResponse.title || 'My parenting discovery'),
        description: parsedResponse.description || transcript.substring(0, 200),
        category: categoryMap[parsedResponse.category] || 'tips',
        ageRange: parsedResponse.suggestedAge || '3-5',
        originalTranscript: transcript
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback response
      return NextResponse.json({
        title: toTitleCase('My parenting discovery'),
        description: transcript.substring(0, 200),
        category: linkUrl && linkUrl.includes('youtube.com') ? 'education' : 'tips',
        ageRange: '3-5',
        originalTranscript: transcript
      })
    }
    
  } catch (error) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}