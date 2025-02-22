import React, { useState, useEffect, useRef } from 'react';
import { openaiService } from '../services/openaiService';
import ChatMessage from './ChatMessage';

const sectionPrompts = {
  'User Info': {
    initial: "Hi! I'm your AI teaching assistant. Let's start by getting to know you. What's your name?",
    followUp: "Great! And what's your email address?",
  },
  'Problem Definition': {
    initial: "Let's define the problem you want to solve. What's the main issue you're addressing?",
    prompts: [
      "Why is this problem important?",
      "Who does it affect and what's the impact?",
      "What are the root causes of this problem?",
      "What would a successful solution look like?"
    ]
  },
  'AI Solution Planner': {
    initial: "Now, let's think about how AI can help solve this problem. What AI technologies could be relevant?",
    prompts: [
      "How would the AI solution work in practice?",
      "What data would the AI need?",
      "How would users interact with the AI?",
      "What unique value does AI bring to this solution?"
    ]
  },
  'Share Feedback': {
    initial: "Let's prepare to share your idea and get feedback. How would you explain your solution in a few sentences?",
    prompts: [
      "What specific feedback would be most helpful?",
      "What aspects of your solution need the most input?",
      "How will you capture and organize the feedback?"
    ]
  },
  'Refine Idea': {
    initial: "Based on the feedback, how can we make your solution even better?",
    prompts: [
      "What feedback was most valuable and why?",
      "How can we enhance the AI aspects?",
      "What improvements will have the biggest impact?"
    ]
  },
  'Start Build': {
    initial: "Let's plan your 75-minute AI product build sprint. First, let's talk about setup and planning. What platform will you use and what are your proof of concept features?",
    prompts: [
      "For core functionality (25 min), how will you implement the basic AI integration and data storage?",
      "For user experience (15 min), how will you ensure the interface is intuitive and the AI prompts are effective?",
      "For testing (10 min), what sample data will you use and how will you identify areas that need simplification?",
      "For final touches (10 min), what welcome screen/instructions will you add and how will you prepare for the demo?"
    ]
  },
  'Presentations & Retro': {
    initial: "Let's prepare your presentation. How would you describe the problem in 20 seconds?",
    prompts: [
      "How would you explain your solution in 25 seconds?",
      "What key features will you demo in 50 seconds?",
      "What was your biggest challenge and learning?",
      "What impact will your solution have?"
    ]
  }
};

function AIChatBot({ currentSection, onUpdateSectionData, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Reset chat when section changes
    setMessages([]);
    setCurrentPromptIndex(0);
    // Only send initial prompt if setup is complete
    if (isSetup && sectionPrompts[currentSection]) {
      const initialPrompt = sectionPrompts[currentSection].initial;
      handleAIResponse(initialPrompt);
    }
  }, [currentSection, isSetup]);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      openaiService.setApiKey(apiKey);
      setIsSetup(true);
      // Start the conversation with initial prompt
      if (sectionPrompts[currentSection]) {
        const initialPrompt = sectionPrompts[currentSection].initial;
        handleAIResponse(initialPrompt);
      }
    } catch (error) {
      console.error('Error setting up API key:', error);
      alert('Error setting up the chat. Please try again.');
    }
  };

  const handleAIResponse = async (message) => {
    const newMessages = [...messages, { role: 'assistant', content: message, section: currentSection }];
    setMessages(newMessages);

    // Extract and update section data
    try {
      const sectionData = openaiService.extractSectionData(newMessages, currentSection);
      if (Object.keys(sectionData).length > 0) {
        onUpdateSectionData(currentSection, sectionData);
      }
    } catch (error) {
      console.error('Error extracting section data:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to chat
    const updatedMessages = [...messages, { role: 'user', content: userMessage, section: currentSection }];
    setMessages(updatedMessages);

    try {
      // Get AI response
      const aiResponse = await openaiService.generateChatResponse(updatedMessages, currentSection);
      
      // Add AI response to chat
      await handleAIResponse(aiResponse.content);

      // Move to next prompt if available
      const sectionConfig = sectionPrompts[currentSection];
      if (sectionConfig.prompts && currentPromptIndex < sectionConfig.prompts.length - 1) {
        setCurrentPromptIndex(prev => prev + 1);
        setTimeout(() => {
          handleAIResponse(sectionConfig.prompts[currentPromptIndex + 1]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again.",
        section: currentSection
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSetup) {
    return (
      <div style={{ 
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: 'black'
      }}>
        <h2>Setup AI Chat Assistant</h2>
        <p style={{ marginBottom: '20px' }}>
          Please enter your OpenAI API key to start chatting with the AI teaching assistant.
          The key will only be stored in memory and not saved anywhere.
        </p>
        <form onSubmit={handleSetupSubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid white',
              backgroundColor: 'black',
              color: 'white'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Start Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '600px',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      border: '1px solid white',
      borderRadius: '8px',
      backgroundColor: 'black'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid white' }}>
        <h2 style={{ margin: 0 }}>AI Teaching Assistant</h2>
        <p style={{ margin: '10px 0 0 0', color: '#888' }}>
          Current section: {currentSection}
        </p>
      </div>

      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
        }}
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.content}
            isAI={message.role === 'assistant'}
          />
        ))}
        {isLoading && (
          <div style={{ color: '#888', textAlign: 'center', padding: '10px' }}>
            AI is thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '20px',
          borderTop: '1px solid white',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid white',
            backgroundColor: 'black',
            color: 'white'
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AIChatBot;