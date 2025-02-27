import { useState, useEffect, useCallback } from 'react';
import { interviewService } from '../../services/interviewService';

/**
 * Custom hook for managing the interview flow
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - The session ID
 * @param {Function} options.onQuestion - Callback for when a new question is ready
 * @param {Function} options.onInterviewComplete - Callback for when the interview is complete
 * @returns {Object} - Interview manager methods and state
 */
export const useInterviewManager = ({ sessionId, onQuestion, onInterviewComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [interviewState, setInterviewState] = useState('idle'); // idle, preparing, active, processing, complete
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Load existing interview if available
  useEffect(() => {
    if (sessionId && interviewState === 'idle') {
      const loadExistingInterview = async () => {
        try {
          const existingInterview = await interviewService.getInterviewSession(sessionId);
          
          if (existingInterview && existingInterview.interview_data) {
            // If we have an existing interview, load it
            console.log('Loading existing interview:', existingInterview);
            
            // Check if the interview was completed
            if (existingInterview.ai_summary) {
              setInterviewState('complete');
              if (onInterviewComplete) {
                onInterviewComplete(
                  existingInterview.interview_data, 
                  existingInterview.ai_summary
                );
              }
            } else {
              // Interview was started but not completed
              // Extract questions and answers
              const interviewData = existingInterview.interview_data;
              const extractedQuestions = interviewData.map(item => item.question);
              
              setQuestions(extractedQuestions);
              setAnswers(interviewData);
              
              // Set the current question to the next unanswered question
              const answeredCount = interviewData.length;
              if (answeredCount < extractedQuestions.length) {
                setCurrentQuestionIndex(answeredCount);
                setCurrentQuestion(extractedQuestions[answeredCount]);
                setInterviewState('active');
                
                if (onQuestion) {
                  onQuestion(extractedQuestions[answeredCount]);
                }
              } else {
                // All questions were answered, but no summary was generated
                setInterviewState('processing');
                generateSummary(interviewData);
              }
            }
          }
        } catch (error) {
          console.error('Error loading existing interview:', error);
          setError('Failed to load existing interview');
        }
      };
      
      loadExistingInterview();
    }
  }, [sessionId, interviewState, onInterviewComplete, onQuestion]);
  
  // Generate interview questions
  const generateQuestions = useCallback(async () => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }
    
    try {
      setInterviewState('preparing');
      
      // Generate questions using the interview service
      const generatedQuestions = await interviewService.generateInterviewQuestions(sessionId);
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(generatedQuestions[0]);
      setInterviewState('active');
      
      if (onQuestion) {
        onQuestion(generatedQuestions[0]);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('Failed to generate interview questions');
      
      // Use default questions as fallback
      const defaultQuestions = interviewService.getDefaultQuestions();
      setQuestions(defaultQuestions);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(defaultQuestions[0]);
      setInterviewState('active');
      
      if (onQuestion) {
        onQuestion(defaultQuestions[0]);
      }
    }
  }, [sessionId, onQuestion]);
  
  // Start the interview
  const startInterview = useCallback(() => {
    setError(null);
    setAnswers([]);
    generateQuestions();
  }, [generateQuestions]);
  
  // Process user's answer and move to next question
  const processAnswer = useCallback(async (answer) => {
    if (!currentQuestion || interviewState !== 'active') {
      return;
    }
    
    try {
      // Save the answer
      const newAnswer = { question: currentQuestion, answer };
      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      
      // Save progress to database
      try {
        await interviewService.saveInterviewSession(
          sessionId,
          newAnswers,
          null, // No summary yet
          newAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')
        );
      } catch (error) {
        console.error('Error saving interview progress:', error);
        // Continue anyway - we'll keep the data in memory
      }
      
      // Check if we have more questions
      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(questions[nextIndex]);
        
        if (onQuestion) {
          onQuestion(questions[nextIndex]);
        }
      } else {
        // Interview complete, generate summary
        setInterviewState('processing');
        await generateSummary(newAnswers);
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      setError('Failed to process answer');
    }
  }, [currentQuestion, currentQuestionIndex, interviewState, questions, answers, sessionId, onQuestion]);
  
  // Generate summary of the interview
  const generateSummary = useCallback(async (interviewData) => {
    try {
      // Generate summary using the interview service
      const summary = await interviewService.generateInterviewSummary(interviewData);
      
      // Save the complete interview with summary
      try {
        await interviewService.saveInterviewSession(
          sessionId,
          interviewData,
          summary,
          interviewData.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')
        );
      } catch (error) {
        console.error('Error saving interview summary:', error);
        // Continue anyway - we'll keep the data in memory
      }
      
      setInterviewState('complete');
      
      if (onInterviewComplete) {
        onInterviewComplete(interviewData, summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate interview summary');
      
      // Use a default summary as fallback
      const defaultSummary = interviewService.getDefaultSummary(interviewData);
      
      setInterviewState('complete');
      
      if (onInterviewComplete) {
        onInterviewComplete(interviewData, defaultSummary);
      }
    }
  }, [sessionId, onInterviewComplete]);
  
  // Get the next question (with slight adaptation based on previous answer)
  const getNextQuestion = useCallback(async (previousAnswer) => {
    if (interviewState !== 'active' || !currentQuestion) {
      return null;
    }
    
    try {
      // Optionally adapt the question based on previous answer
      const adaptedQuestion = await interviewService.adaptQuestion(
        currentQuestion, 
        previousAnswer
      );
      
      return adaptedQuestion;
    } catch (error) {
      console.error('Error adapting question:', error);
      // Fallback to the original question
      return currentQuestion;
    }
  }, [interviewState, currentQuestion]);
  
  return {
    currentQuestion,
    interviewState,
    error,
    startInterview,
    processAnswer,
    getNextQuestion,
    progress: {
      current: currentQuestionIndex + 1,
      total: questions.length
    }
  };
};

export default useInterviewManager;