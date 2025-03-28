import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Request, Response } from "firebase-functions";
import OpenAI from "openai";

// Define the secret
const openAiSecret = defineSecret('OPENAI_API_KEY');

export const analyzeReceipt = onRequest({
  cors: true,
  region: 'us-central1',
  memory: '256MiB',
  maxInstances: 10,
  secrets: [openAiSecret]
}, async (req: Request, res: Response) => {
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  try {
    // Change this line to await the secret value
    const apiKey = await openAiSecret.value();
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Validate image data
    const { image } = req.body;
    if (!image) {
      console.log('No image provided in request');
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    console.log('Making OpenAI API request');
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
    });

    console.log('Successfully received OpenAI response');
    res.status(200).json({ 
      text: response.choices[0]?.message?.content 
    });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze receipt: ' + (error.message || 'Unknown error') 
    });
  }
}); 