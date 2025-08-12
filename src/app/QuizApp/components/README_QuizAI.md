# QuizAI Component

The QuizAI component integrates OpenAI into the QuizEditor to allow hosts to generate quiz questions using natural language prompts.

## Features

### 🤖 AI Question Generation

- **Natural Language Prompts**: Hosts can describe what questions they want in plain English
- **Smart Integration**: Generated questions follow all existing QuizEditor rules and constraints
- **Batch Generation**: Creates 1-3 questions per request to keep it manageable

### 💬 Chat Interface

- **Compact Input Box**: Small, unobtrusive textarea at the top of the QuizEditor
- **Real-time Feedback**: Shows generation status, success messages, and error handling
- **Keyboard Support**: Press Enter to generate questions

### ↩️ Undo Functionality

- **One-Click Revert**: "Undo" button appears after AI generation
- **Complete Rollback**: Removes all AI-generated questions and restores previous state
- **Smart Tracking**: Keeps track of what was generated vs. manually created

## Usage Examples

### Effective Prompts

- `"Create 2 questions about Norwegian culture"`
- `"Generate science questions for teenagers"`
- `"Make 3 geography questions about Europe"`
- `"Create fun questions about movies from the 90s"`

### Question Constraints

- **Format**: Multiple choice with 2 or 4 options
- **Correctness**: Exactly one correct answer per question
- **Colors**: Predefined color scheme (Red, Blue, Yellow, Green)
- **Icons**: Standard shapes (▲, ◆, ●, ■)
- **Time Limit**: Default 30 seconds, "standard" point type

## Technical Implementation

### API Integration

- **Endpoint**: `/api/generate-quiz`
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7 for creative but consistent responses
- **Max Tokens**: 1500 to handle multiple questions

### Error Handling

- **API Key Validation**: Graceful fallback if OpenAI not configured
- **Rate Limiting**: Handles quota exceeded scenarios
- **JSON Parsing**: Robust parsing with fallback error messages
- **Network Issues**: Clear error messages for connection problems

### Integration Points

- **QuizEditor**: Seamlessly integrated at the top of the main content area
- **Question Management**: Uses existing `updateQuizData` patterns
- **State Management**: Preserves all existing QuizEditor functionality

## Environment Setup

Ensure `OPENAI_API_KEY` is set in your `.env.local` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## UI/UX Design

### Visual Design

- **Blue Gradient Theme**: Matches AI assistant aesthetics
- **Compact Layout**: Doesn't interfere with existing editor space
- **Clear Status Indicators**: Loading states, success/error messages
- **Accessible Controls**: Proper contrast and keyboard navigation

### User Experience

- **Non-Intrusive**: Doesn't disrupt existing workflow
- **Quick Access**: Always visible at the top of the editor
- **Immediate Feedback**: Real-time status updates
- **Reversible Actions**: Undo functionality for peace of mind

## Future Enhancements

- **Question Refinement**: Allow editing of AI-generated questions before adding
- **Topic Suggestions**: Provide common prompt templates
- **Difficulty Levels**: Specify easy/medium/hard in prompts
- **Media Integration**: AI-suggested images for questions
