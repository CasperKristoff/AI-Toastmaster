import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Jeopardy AI generation will not work.');
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { prompt, categories } = await request.json();

    const systemPrompt = `You are an expert Jeopardy game creator. Create engaging, fun, and appropriate questions for a Jeopardy game.

Key requirements:
- Each category should have 5 questions with point values: 1, 2, 3, 4, 5
- Questions should follow Jeopardy format: the host reads an "answer" and players respond with the "question"
- Questions should start with "What is...", "Who is...", "Where is...", etc.
- Difficulty should increase with point values (1 = easiest, 5 = hardest)
- Keep questions family-friendly and engaging
- Make sure answers are clear and unambiguous

Current categories: ${categories?.map((c: { name: string }) => c.name).join(', ') || 'None'}

Respond with JSON in this exact format:
{
  "categories": [
    {
      "id": "1",
      "name": "Category Name",
      "questions": [
        {
          "id": "1-1",
          "answer": "This planet is known as the Red Planet",
          "question": "What is Mars?",
          "points": 1
        }
      ]
    }
  ]
}`;

    let userPrompt = prompt;

    // Add context based on the type of request
    if (prompt.includes('Generate') || prompt.includes('Create')) {
      userPrompt = `${prompt}. Make the categories relevant to a general audience and ensure the questions are engaging and fun.`;
    } else if (prompt.includes('harder') || prompt.includes('challenging')) {
      userPrompt = `${prompt}. Increase the difficulty of existing questions while keeping them fair and answerable.`;
    } else if (prompt.includes('easier')) {
      userPrompt = `${prompt}. Make the questions more accessible while still being engaging.`;
    }

    if (!openai) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' 
        },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse the JSON response
    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate the structure
      if (parsedResponse.categories && Array.isArray(parsedResponse.categories)) {
        return NextResponse.json({
          success: true,
          categories: parsedResponse.categories,
          message: 'Jeopardy categories generated successfully!'
        });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch {
      // If JSON parsing fails, return the raw response as a message
      return NextResponse.json({
        success: false,
        message: response,
        suggestions: response
      });
    }

  } catch (error) {
    console.error('Error generating Jeopardy content:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'OpenAI quota exceeded. Please check your billing or try again later.' 
          },
          { status: 429 }
        );
      } else if (error.message.includes('401')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'OpenAI API key is invalid. Please check your configuration.' 
          },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error generating content. Please try again.' 
      },
      { status: 500 }
    );
  }
} 