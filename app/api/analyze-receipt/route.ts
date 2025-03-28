import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletion } from 'openai/resources'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

// Helper function to add CORS headers
function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return corsResponse({})
}

export async function POST(request: Request) {
  console.log('Received POST request')

  try {
    // Read the request body once and store it
    let body;
    try {
      body = await request.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return corsResponse({ error: 'Invalid request format' }, 400)
    }
    
    // Validate API key first
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('OpenAI API key is missing')
      return corsResponse({ error: 'Server configuration error' }, 500)
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Validate image data
    if (!body?.image) {
      console.log('No image provided in request')
      return corsResponse({ error: 'No image provided' }, 400)
    }

    // Set timeout for OpenAI request
    const timeoutMs = 30000 // 30 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )

    console.log('Making OpenAI API request')
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Please analyze this receipt and provide the following information in a structured format:\n\nStore Name:\nDate:\nTotal Amount:\nItems Purchased:\nPayment Method:\nAdditional Details:" 
            },
            {
              type: "image_url",
              image_url: {
                url: body.image,
                detail: "high"
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    })

    // Race between timeout and actual request
    const response = await Promise.race([openaiPromise, timeoutPromise]) as ChatCompletion

    // Validate response structure
    if (!response || !response.choices?.[0]?.message?.content) {
      console.error('Invalid or empty response from OpenAI')
      throw new Error('Invalid response from AI service')
    }

    console.log('Successfully received OpenAI response')
    return corsResponse({ 
      text: response.choices[0].message.content 
    })
  } catch (error: any) {
    console.error('API Error:', error)
    
    // Handle specific error types
    if (error.message === 'Request timeout') {
      return corsResponse(
        { error: 'Request timed out' },
        504
      )
    }
    
    if (error.response?.status === 429) {
      return corsResponse(
        { error: 'Rate limit exceeded' },
        429
      )
    }

    return corsResponse(
      { error: 'Failed to analyze receipt: ' + (error.message || 'Unknown error') },
      500
    )
  }
}