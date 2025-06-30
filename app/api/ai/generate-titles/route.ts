import { NextResponse } from 'next/server'
import { toTitleCase } from '@/utils/titleCase'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function POST(request: Request) {
  try {
    const { description, linkUrl, category } = await request.json()
    
    if (!description) {
      return NextResponse.json({ error: 'Missing description' }, { status: 400 })
    }
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }
    
    // Construct the prompt for Gemini
    const prompt = `You are an expert parent content curator. Based on this parent's experience/tip, generate 5 compelling titles.

The parent's experience: "${description}"
${linkUrl ? `They're sharing: ${linkUrl}` : ''}
${category ? `Category: ${category}` : ''}

Generate exactly 5 different titles that:
- Are engaging and highlight the key benefit
- Are specific and concrete (avoid generic phrases)
- Are under 60 characters
- Would make other parents want to read more

IMPORTANT: Your response must be valid JSON with this exact format:
{
  "titles": [
    "Title option 1",
    "Title option 2", 
    "Title option 3",
    "Title option 4",
    "Title option 5"
  ]
}

Good title examples:
- "Khan Academy Kids: Free Learning That Actually Works"
- "The LEGO Set That Kept My 5yo Busy for Hours"
- "Screen-Free Activity That Saved Our Rainy Day"
- "Why My Toddler Stopped Crying at Bedtime"
- "The $10 Toy That Teaches Colors Better Than Apps"`

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
          temperature: 0.9, // Higher temperature for more variety
          maxOutputTokens: 300,
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 })
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
      
      // Apply title case to all titles
      const titles = parsedResponse.titles.map((title: string) => toTitleCase(title))
      
      return NextResponse.json({ titles })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback response with generic titles
      return NextResponse.json({
        titles: [
          toTitleCase("My parenting discovery"),
          toTitleCase("What worked for us today"),
          toTitleCase("A tip every parent should know"),
          toTitleCase("How we solved this parenting challenge"),
          toTitleCase("The thing that made parenting easier")
        ]
      })
    }
    
  } catch (error) {
    console.error('Title generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate titles' },
      { status: 500 }
    )
  }
}