import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set. Jeopardy AI generation will not work.",
  );
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      categories,
      boardSize = 5,
      eventName,
      eventDescription,
      eventTone,
    } = await request.json();

    // Create tone-specific instructions
    const toneInstructions = {
      safe: "Keep questions light, fun, and universally appealing. Use gentle humor and avoid controversial topics.",
      wild: "Make questions more edgy and party-focused. Include pop culture references and adult humor while keeping it fun.",
      "family-friendly":
        "Focus on kid-appropriate content. Use educational topics, family movies, and wholesome references.",
      corporate:
        "Keep questions professional and office-appropriate. Focus on business, current events, and clean humor.",
    };

    const toneInstruction =
      toneInstructions[eventTone as keyof typeof toneInstructions] ||
      toneInstructions.safe;

    const systemPrompt = `You are an expert Jeopardy game creator. Create engaging, fun, and appropriate questions for a Jeopardy game.

EVENT CONTEXT:
- Event Name: ${eventName || "General Event"}
- Event Description: ${eventDescription || "No specific description provided"}
- Event Tone: ${eventTone || "safe"} - ${toneInstruction}

CRITICAL REQUIREMENTS:
- You MUST create exactly ${boardSize} categories (no more, no less)
- Each category MUST have exactly ${boardSize} questions with point values from 1 to ${boardSize}
- The response must be a ${boardSize}x${boardSize} board

Key requirements:
- Questions should follow Jeopardy format: the host reads an "answer" and players respond with the "question"
- Questions should start with "What is...", "Who is...", "Where is...", etc.
- Difficulty should increase with point values (1 = easiest, ${boardSize} = hardest)
- Tailor the content and humor to match the event tone: ${toneInstruction}
- Make sure answers are clear and unambiguous

Current categories: ${categories?.map((c: { name: string }) => c.name).join(", ") || "None"}

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
    if (prompt.includes("Generate") || prompt.includes("Create")) {
      userPrompt = `${prompt}. Create exactly ${boardSize} categories with ${boardSize} questions each for a ${boardSize}x${boardSize} board. Make the categories relevant to a general audience and ensure the questions are engaging and fun.`;
    } else if (prompt.includes("harder") || prompt.includes("challenging")) {
      userPrompt = `${prompt}. Increase the difficulty of existing questions while keeping them fair and answerable. Maintain ${boardSize} categories with ${boardSize} questions each.`;
    } else if (prompt.includes("easier")) {
      userPrompt = `${prompt}. Make the questions more accessible while still being engaging. Maintain ${boardSize} categories with ${boardSize} questions each.`;
    }

    if (!openai) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Try to parse the JSON response
    try {
      const parsedResponse = JSON.parse(response);

      // Validate the structure and board size
      if (
        parsedResponse.categories &&
        Array.isArray(parsedResponse.categories)
      ) {
        // Check if the number of categories matches the board size
        if (parsedResponse.categories.length !== boardSize) {
          return NextResponse.json({
            success: false,
            message: `AI generated ${parsedResponse.categories.length} categories instead of ${boardSize}. Please try again.`,
            suggestions:
              "Try regenerating the categories to get the correct number.",
          });
        }

        // Check if each category has the correct number of questions
        for (let i = 0; i < parsedResponse.categories.length; i++) {
          const category = parsedResponse.categories[i];
          if (!category.questions || category.questions.length !== boardSize) {
            return NextResponse.json({
              success: false,
              message: `Category "${category.name}" has ${category.questions?.length || 0} questions instead of ${boardSize}. Please try again.`,
              suggestions:
                "Try regenerating the categories to get the correct number of questions per category.",
            });
          }
        }

        return NextResponse.json({
          success: true,
          categories: parsedResponse.categories,
          message: `Jeopardy categories generated successfully! (${boardSize}x${boardSize} board)`,
        });
      } else {
        throw new Error("Invalid response structure");
      }
    } catch {
      // If JSON parsing fails, return the raw response as a message
      return NextResponse.json({
        success: false,
        message: response,
        suggestions: response,
      });
    }
  } catch (error) {
    console.error("Error generating Jeopardy content:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "OpenAI quota exceeded. Please check your billing or try again later.",
          },
          { status: 429 },
        );
      } else if (error.message.includes("401")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "OpenAI API key is invalid. Please check your configuration.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Error generating content. Please try again.",
      },
      { status: 500 },
    );
  }
}
