import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import twilio from 'twilio'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const numMedia = parseInt(formData.get('NumMedia') as string)
    const from = formData.get('From') as string
    
    if (numMedia === 0) {
      await twilioClient.messages.create({
        body: 'Please send an image of a receipt to analyze.',
        to: from,
        from: process.env.TWILIO_PHONE_NUMBER,
      })
      return NextResponse.json({ message: 'No image received' })
    }

    const mediaUrl = formData.get('MediaUrl0') as string

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
                url: mediaUrl,
                detail: "high"
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    })

    const analysis = response.choices[0]?.message?.content || 'Sorry, I could not analyze this receipt.'

    await twilioClient.messages.create({
      body: analysis,
      to: from,
      from: process.env.TWILIO_PHONE_NUMBER || '',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}