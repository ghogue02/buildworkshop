# AI-Driven Video Interviewer Implementation Plan

After analyzing the current infrastructure, this plan outlines how to implement an AI-driven video interviewer that integrates with the existing user database and leverages current video and AI capabilities.

## 1. Project Overview

### Current Infrastructure Analysis

The application currently has:
- Supabase backend with user data storage
- Video recording capabilities using browser APIs
- Speech recognition using Web Speech API
- OpenAI integration for AI features
- React-based frontend with multiple builder sections

### Integration Approach

The AI-driven video interviewer will be implemented as a new section in the application that:
- Leverages the existing user database (Supabase)
- Builds upon current video and speech recognition capabilities
- Integrates with the OpenAI service for AI-powered conversations
- Adds 3D avatar rendering and animation capabilities

## 2. Technology Stack & Services

### 1. 3D Avatar & Animation
- **Avatar Creation**: Ready Player Me (customizable 3D avatars)
- **Web-Based Rendering**: Three.js (WebGL-based 3D rendering)
- **Lip-Sync Animation**: TalkingHead.js (for real-time speech-driven lip-sync)

### 2. Speech Recognition (STT)
- **Primary**: Web Speech API (already implemented in VideoRecorder component)
- **Fallback**: OpenAI Whisper API (already integrated in videoService)

### 3. Speech Synthesis (TTS)
- **Primary**: Web Speech API (SpeechSynthesis interface)
- **Alternative**: Microsoft Azure Neural TTS (for higher quality and viseme data)

### 4. Conversational AI
- **Primary**: OpenAI GPT-4 (already integrated in openaiService)
- **Structured Flow**: Custom interview flow management system

### 5. Database Integration
- **Storage**: Supabase (already implemented)
- **Tables**: Extend existing video_recordings table or create a new interviews table

## 3. Implementation Plan

### Phase 1: Core Infrastructure Setup (2 weeks)

#### 1.1 Create New Component Structure
```
src/
  components/
    AIInterviewer/
      AIInterviewer.js       # Main component
      AvatarRenderer.js      # Three.js avatar rendering
      InterviewManager.js    # Interview flow management
      SpeechHandler.js       # Speech recognition and synthesis
```

#### 1.2 Database Schema Extension
Extend the Supabase database with a new table for interview sessions:

```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_inputs(session_id),
  interview_data JSONB,
  transcript TEXT,
  ai_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.3 Service Layer Extension
Create a new service for interview management:

```
src/
  services/
    interviewService.js      # Handle interview data and AI interactions
```

### Phase 2: 3D Avatar Implementation (3 weeks)

#### 2.1 Avatar Integration
- Implement Three.js canvas for avatar rendering
- Integrate Ready Player Me avatar loading
- Set up basic avatar animations (idle, talking, listening)

#### 2.2 Lip-Sync System
- Implement TalkingHead.js for lip-sync animation
- Connect with speech synthesis to drive mouth movements
- Add facial expressions based on conversation context

#### 2.3 Avatar Customization
- Allow selection from predefined avatars
- Implement avatar positioning and camera controls
- Add environment/background options

### Phase 3: Conversation System (3 weeks)

#### 3.1 Speech Recognition Enhancement
- Extend existing Web Speech API implementation
- Add real-time feedback visualization
- Implement error handling and fallback mechanisms

#### 3.2 Speech Synthesis Implementation
- Implement Web Speech API's SpeechSynthesis
- Add voice selection options
- Implement speech queue management

#### 3.3 Conversational AI Integration
- Extend openaiService with interview-specific methods
- Implement structured interview flow with GPT-4
- Create predefined question templates with dynamic adaptation

### Phase 4: Interview Flow & UI (2 weeks)

#### 4.1 Interview UI
- Design and implement the interview interface
- Create controls for starting/stopping the interview
- Add visual feedback for speech recognition status

#### 4.2 Interview Flow Management
- Implement interview session management
- Create question sequencing logic
- Add adaptive follow-up question generation

#### 4.3 Results & Analytics
- Store interview transcripts and responses
- Generate AI-powered summaries of interviews
- Create visualizations of interview insights

### Phase 5: Integration & Testing (2 weeks)

#### 5.1 User Database Integration
- Connect interview sessions to existing user profiles
- Implement session persistence and recovery
- Add interview history and review capabilities

#### 5.2 Performance Optimization
- Optimize 3D rendering for different devices
- Implement progressive loading for avatars
- Add caching mechanisms for improved performance

#### 5.3 Testing & Refinement
- Conduct user testing sessions
- Refine avatar animations and expressions
- Improve conversation flow based on feedback

## 4. Technical Implementation Details

### 4.1 Avatar Rendering with Three.js

```javascript
// AvatarRenderer.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const AvatarRenderer = ({ avatarUrl, visemeData, emotion }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    
    // Set up lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 2);
    scene.add(light);
    
    // Load avatar model
    const loader = new GLTFLoader();
    loader.load(avatarUrl, (gltf) => {
      const avatar = gltf.scene;
      scene.add(avatar);
      avatarRef.current = avatar;
      
      // Position camera
      camera.position.z = 1.5;
      camera.position.y = 1.5;
      camera.lookAt(0, 1, 0);
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    });
    
    sceneRef.current = scene;
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [avatarUrl]);
  
  // Update visemes when speech data changes
  useEffect(() => {
    if (avatarRef.current && visemeData) {
      // Apply viseme data to avatar face
      // This would use TalkingHead.js or a similar library
    }
  }, [visemeData]);
  
  // Update emotion when it changes
  useEffect(() => {
    if (avatarRef.current && emotion) {
      // Apply emotion to avatar face
    }
  }, [emotion]);
  
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default AvatarRenderer;
```

### 4.2 Speech Recognition & Synthesis Integration

```javascript
// SpeechHandler.js
import React, { useState, useEffect, useRef } from 'react';

const SpeechHandler = ({ onTranscript, onSpeechEnd, onVisemeData }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        onTranscript(currentTranscript);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        } else {
          onSpeechEnd(transcript);
        }
      };
    }
    
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Start listening
  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };
  
  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  
  // Speak text
  const speak = (text, voice = null) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Generate viseme data (simplified example)
      const mockVisemeData = text.split(' ').map((word, index) => ({
        word,
        start: index * 0.3,
        end: (index + 1) * 0.3,
        visemes: [/* viseme data would go here */]
      }));
      
      onVisemeData(mockVisemeData);
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };
  
  return {
    transcript,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak
  };
};

export default SpeechHandler;
```

### 4.3 Interview Manager Implementation

```javascript
// InterviewManager.js
import { useEffect, useState } from 'react';
import { openaiService } from '../../services/openaiService';

const InterviewManager = ({ sessionId, onQuestion, onInterviewComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [interviewState, setInterviewState] = useState('idle'); // idle, preparing, active, processing, complete
  
  // Initialize interview questions
  useEffect(() => {
    if (sessionId && interviewState === 'preparing') {
      generateQuestions();
    }
  }, [sessionId, interviewState]);
  
  // Generate interview questions using OpenAI
  const generateQuestions = async () => {
    try {
      const result = await openaiService.generateInterviewQuestions();
      setQuestions(result.questions);
      setCurrentQuestion(result.questions[0]);
      setInterviewState('active');
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to predefined questions
      const defaultQuestions = [
        "Tell me about your project idea.",
        "What problem does your solution solve?",
        "How does your solution use AI technology?",
        "What were the biggest challenges you faced?",
        "What would you do differently next time?"
      ];
      setQuestions(defaultQuestions);
      setCurrentQuestion(defaultQuestions[0]);
      setInterviewState('active');
    }
  };
  
  // Start the interview
  const startInterview = () => {
    setInterviewState('preparing');
  };
  
  // Process user's answer and move to next question
  const processAnswer = async (answer) => {
    const currentIndex = questions.indexOf(currentQuestion);
    
    // Save the answer
    const newAnswers = [...answers, { question: currentQuestion, answer }];
    setAnswers(newAnswers);
    
    // Check if we have more questions
    if (currentIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestion(questions[currentIndex + 1]);
    } else {
      // Interview complete
      setInterviewState('processing');
      
      try {
        // Generate summary with OpenAI
        const summary = await openaiService.generateInterviewSummary(newAnswers);
        onInterviewComplete(newAnswers, summary);
        setInterviewState('complete');
      } catch (error) {
        console.error('Error generating summary:', error);
        onInterviewComplete(newAnswers, { error: 'Failed to generate summary' });
        setInterviewState('complete');
      }
    }
  };
  
  // Get the next question (with slight adaptation based on previous answer)
  const getNextQuestion = async (previousAnswer) => {
    if (interviewState !== 'active') return null;
    
    try {
      // Optionally adapt the question based on previous answer
      const adaptedQuestion = await openaiService.adaptQuestion(
        currentQuestion, 
        previousAnswer
      );
      return adaptedQuestion;
    } catch (error) {
      // Fallback to the original question
      return currentQuestion;
    }
  };
  
  return {
    currentQuestion,
    interviewState,
    startInterview,
    processAnswer,
    getNextQuestion
  };
};

export default InterviewManager;
```

## 5. Integration with Existing Application

### 5.1 Add to BuilderView Component

Modify BuilderView.js to include the new AI Interviewer component:

```javascript
// In BuilderView.js
import AIInterviewer from './components/AIInterviewer/AIInterviewer';

// Add to sectionOrder array
const sectionOrder = [
  'User Info',
  'Problem Definition',
  'MVP Planner',
  'Give & Get Feedback',
  'Refine Your MVP',
  'Start Build',
  'Presentations & Retro',
  'AI Interview',  // New section
  'Video Reflection'
];

// Add to navigation buttons
<button
  onClick={() => setCurrentSection('aiinterview')}
  style={{
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: currentSection === 'aiinterview' ? 'white' : 'black',
    color: currentSection === 'aiinterview' ? 'black' : 'white',
    cursor: 'pointer',
    fontWeight: currentSection === 'aiinterview' ? 'bold' : 'normal',
  }}
>
  AI Interview
</button>

// Add to section rendering
{currentSection === 'aiinterview' && (
  <AIInterviewer 
    sessionId={sessionId} 
    onComplete={(data) => {
      // Save interview data
      handleSectionSave('AI Interview', data);
      // Optionally move to next section
      setCurrentSection('videoreflection');
    }} 
  />
)}
```

### 5.2 Extend OpenAI Service

Add interview-specific methods to openaiService.js:

```javascript
// Add to openaiService.js

async generateInterviewQuestions(builderData, apiKey) {
  this.initializeOpenAI(apiKey);
  if (!this.openai) {
    throw new Error('OpenAI client not initialized. Please provide an API key.');
  }

  return this.queueRequest(async () => {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer specializing in AI product development. Generate a structured interview with 5 questions to understand the builder's project, challenges, and learnings."
          },
          {
            role: "user",
            content: `Generate 5 interview questions for a builder who has created an AI-powered product. Here's what we know about their project: ${JSON.stringify(builderData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        questions: JSON.parse(completion.choices[0].message.content).questions
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate interview questions');
    }
  });
}

async adaptQuestion(question, previousAnswer, apiKey) {
  this.initializeOpenAI(apiKey);
  if (!this.openai) {
    throw new Error('OpenAI client not initialized. Please provide an API key.');
  }

  return this.queueRequest(async () => {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer. Adapt the next question slightly based on the previous answer, while maintaining the core intent of the original question."
          },
          {
            role: "user",
            content: `Original question: "${question}"\nPrevious answer: "${previousAnswer}"\nAdapt the question slightly to make it more relevant based on their answer.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Return the original question as fallback
      return question;
    }
  });
}

async generateInterviewSummary(interviewData, apiKey) {
  this.initializeOpenAI(apiKey);
  if (!this.openai) {
    throw new Error('OpenAI client not initialized. Please provide an API key.');
  }

  return this.queueRequest(async () => {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing interview responses and providing insightful summaries. Focus on key insights, strengths, and areas for improvement."
          },
          {
            role: "user",
            content: `Analyze these interview responses and provide a summary with key insights:\n${JSON.stringify(interviewData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate interview summary');
    }
  });
}
```

## 6. Resource Requirements

### 6.1 Dependencies to Add
```json
{
  "dependencies": {
    "three": "^0.150.0",
    "react-three-fiber": "^8.12.0",
    "@readyplayerme/rpm-react-sdk": "^0.1.4",
    "talking-head-js": "^0.3.0"
  }
}
```

### 6.2 Environment Variables
```
# Add to your .env file
REACT_APP_AZURE_SPEECH_KEY=your_azure_speech_key
REACT_APP_AZURE_SPEECH_REGION=your_azure_region
```

## 7. Timeline and Phased Rollout

### Phase 1: MVP (4 weeks)
- Basic 3D avatar rendering
- Simple predefined questions
- Web Speech API integration
- Basic database integration

### Phase 2: Enhanced Features (4 weeks)
- Improved avatar animations
- Dynamic question adaptation
- Better speech synthesis
- Interview analytics

### Phase 3: Full Implementation (4 weeks)
- Complete avatar customization
- Advanced conversation flow
- Comprehensive analytics
- Performance optimization

## 8. Conclusion

This implementation plan adapts the AI-driven video interviewer concept to the existing infrastructure, leveraging current capabilities while adding new features. The phased approach allows for iterative development and testing, ensuring a robust and user-friendly final product.

The AI interviewer will provide valuable insights into builder projects, complementing existing data collection methods and enhancing the overall user experience.
