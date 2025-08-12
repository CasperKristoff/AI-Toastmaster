import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Quiz AI generation will not work.");
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  console.log("Quiz generation API called");

  try {
    const {
      prompt,
      existingQuestions = [],
      quizTitle: _quizTitle = "Live Quiz",
    } = await request.json();

    console.log("Received prompt:", prompt);
    console.log("Existing questions count:", existingQuestions.length);

    if (!openai) {
      console.log("OpenAI not configured - API key missing");
      return NextResponse.json(
        {
          success: false,
          message:
            "🔑 OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file and restart the server.",
          details: "The AI feature requires an OpenAI API key to function.",
        },
        { status: 500 },
      );
    }

    console.log("Calling OpenAI API...");

    // Simplified request for faster generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate 1-2 quiz questions. IMPORTANT: Always respond in Norwegian, etc. Always respond only with valid JSON.

Format: {"questions":[{"id":"q1","question":"question text in same language","options":[{"id":"a","text":"option in same language","isCorrect":true,"color":"#E53E3E","icon":"▲"},{"id":"b","text":"option in same language","isCorrect":false,"color":"#3182CE","icon":"◆"}],"timeLimit":30,"pointType":"standard"}]}

Colors: A="#E53E3E", B="#3182CE", C="#D69E2E", D="#38A169"
Icons: A="▲", B="◆", C="●", D="■"`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 600, // Increased slightly for multilingual support
    });

    console.log("OpenAI API call completed");
    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.log("No response content from OpenAI");
      throw new Error("No response from OpenAI");
    }

    console.log("Parsing OpenAI response...");

    // Try to parse the JSON response
    try {
      const parsedResponse = JSON.parse(response);

      if (
        parsedResponse.questions &&
        Array.isArray(parsedResponse.questions) &&
        parsedResponse.questions.length > 0
      ) {
        // Validate each question structure
        for (const question of parsedResponse.questions) {
          if (
            !question.id ||
            !question.question ||
            !Array.isArray(question.options)
          ) {
            throw new Error("Invalid question structure");
          }

          if (question.options.length !== 2 && question.options.length !== 4) {
            throw new Error("Each question must have exactly 2 or 4 options");
          }

          const correctOptions = question.options.filter(
            (opt: { isCorrect: boolean }) => opt.isCorrect,
          );
          if (correctOptions.length !== 1) {
            throw new Error(
              "Each question must have exactly one correct answer",
            );
          }
        }

        return NextResponse.json({
          success: true,
          questions: parsedResponse.questions,
          message: `Generated ${parsedResponse.questions.length} quiz question${parsedResponse.questions.length !== 1 ? "s" : ""} successfully!`,
        });
      } else {
        throw new Error("Invalid response structure - no questions array");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      // If JSON parsing fails, return the raw response as a message
      return NextResponse.json({
        success: false,
        message:
          "Failed to parse AI response. Please try rephrasing your request.",
        rawResponse: response,
      });
    }
  } catch (error) {
    console.error("Error generating quiz content:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      console.log("Error details:", error.message);

      if (error.message.includes("429") || error.message.includes("quota")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "🚫 OpenAI quota exceeded. Please check your billing or try again later.",
            details: "You may have reached your API usage limit.",
          },
          { status: 429 },
        );
      } else if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "🔐 OpenAI API key is invalid. Please check your .env.local configuration.",
            details: "The API key may be expired or incorrect.",
          },
          { status: 401 },
        );
      } else if (
        error.message.includes("timeout") ||
        error.message.includes("TIMEOUT")
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "⏱️ Request timed out. Please try with a simpler prompt or try again.",
            details: "The AI took too long to respond.",
          },
          { status: 408 },
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("ECONNRESET")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "🌐 Network error connecting to OpenAI. Please try again.",
            details: "There was a connection issue with the AI service.",
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "❌ Error generating quiz questions. Please try again.",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
