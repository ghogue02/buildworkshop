# AI Interviewer Component

This component provides an AI-driven video interviewer that uses a 3D avatar, speech recognition, and conversational AI to conduct structured interviews.

## Overview

The AI Interviewer component is designed to:

1. Display a 3D avatar that conducts the interview
2. Use speech recognition to process user responses
3. Generate AI-powered questions and follow-ups
4. Provide a summary of the interview

## Component Structure

The AI Interviewer is composed of several sub-components:

- **AIInterviewer.js**: The main component that integrates everything
- **AvatarRenderer.js**: Handles the 3D avatar rendering and animations
- **SpeechHandler.js**: Manages speech recognition and synthesis
- **InterviewManager.js**: Controls the interview flow and question generation

## Services

The component relies on these services:

- **interviewService.js**: Handles interview data storage and retrieval
- **openaiService.js**: Provides AI capabilities for question generation and summarization

## Usage

To use the AI Interviewer in a React component:

```jsx
import AIInterviewer from '../components/AIInterviewer';

function MyComponent() {
  return (
    <AIInterviewer 
      sessionId="user-session-id" 
      onComplete={(data) => {
        console.log('Interview completed:', data);
        // Handle interview completion
      }} 
    />
  );
}
```

### Props

- **sessionId** (required): The user's session ID for data persistence
- **onComplete** (optional): Callback function called when the interview is complete

## Development Mode

In development mode, the component provides fallback functionality when:

1. No Supabase connection is available
2. No OpenAI API key is configured

This allows for testing and development without requiring a full backend setup.

## Interview Flow

1. The avatar introduces itself and explains the interview process
2. The system generates questions based on the user's project data
3. The avatar asks each question and listens for the user's response
4. The system processes the response and may adapt follow-up questions
5. After all questions are answered, the system generates a summary
6. The avatar presents the summary and concludes the interview

## Customization

### Avatar Customization

The avatar can be customized by modifying the `AvatarRenderer.js` component:

```jsx
<AvatarRenderer 
  avatarUrl="/path/to/custom/avatar.glb"
  emotion="happy"
  visemeData={lipSyncData}
/>
```

### Question Customization

Default questions can be modified in the `interviewService.js` file:

```javascript
getDefaultQuestions() {
  return [
    "Tell me about your project idea and what problem it solves.",
    "How does your solution use AI technology?",
    "What were the biggest challenges you faced during development?",
    "How did you incorporate feedback to improve your solution?",
    "What would you do differently if you were to start over?"
  ];
}
```

## Future Enhancements

1. **Full 3D Avatar Implementation**: Replace the placeholder with a full Three.js implementation
2. **Improved Lip Sync**: Add more accurate viseme mapping for better lip synchronization
3. **More Dynamic Questions**: Enhance the question adaptation based on previous answers
4. **Emotion Detection**: Add emotion detection from user's voice to adapt the avatar's responses
5. **Multiple Avatar Options**: Allow users to select from different avatar options

## Troubleshooting

### Speech Recognition Issues

If speech recognition is not working:

1. Ensure you're using a supported browser (Chrome, Edge, or Safari)
2. Check that microphone permissions are granted
3. Verify that no other application is using the microphone

### Avatar Rendering Issues

If the avatar is not rendering correctly:

1. Check that WebGL is supported and enabled in your browser
2. Verify that the avatar model file is accessible
3. Check the browser console for any Three.js related errors