import { NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export async function POST(request: Request) {
  try {
    const { transcript, linkUrl } = await request.json()
    
    if (!transcript || !linkUrl) {
      return NextResponse.json({ error: 'Missing transcript or linkUrl' }, { status: 400 })
    }
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }
    
    // Construct the prompt for Gemini
    const prompt = `You are helping a parent share their discovery with other parents. They've provided a link to ${linkUrl} and described their experience.

Their description: "${transcript}"

Based on their description and the link they're sharing, create:
1. A catchy, engaging title (max 60 characters) that captures the essence of why this helped them
2. A clear, concise description (max 200 characters) that explains the benefit to other parents

Format your response as JSON:
{
  "title": "Your catchy title here",
  "description": "Your clear description here",
  "category": "app|toy|video|website|tip",
  "suggestedAge": "0-2|3-5|5-7|6-8|8+"
}

Determine the category based on the link:
- YouTube/video links → "video"
- App store links → "app"
- Amazon/shopping links → "toy"
- Other websites → "website"
- No specific link → "tip"

Determine age range from their description or make a reasonable guess based on the content.`

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
      
      return NextResponse.json({
        title: parsedResponse.title || 'My parenting discovery',
        description: parsedResponse.description || transcript.substring(0, 200),
        category: parsedResponse.category || 'tip',
        ageRange: parsedResponse.suggestedAge || '3-5',
        originalTranscript: transcript
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback response
      return NextResponse.json({
        title: 'My parenting discovery',
        description: transcript.substring(0, 200),
        category: linkUrl.includes('youtube.com') ? 'video' : 'website',
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