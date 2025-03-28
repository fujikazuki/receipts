import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    
    const response = await openai.chat.completions.create({
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
                url: image,
                detail: "high"
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    })

    return NextResponse.json({ text: response.choices[0].message.content })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 })
  }
}