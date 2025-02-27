import { supabase, withRetry } from '../supabaseClient';
import { openaiService } from './openaiService';
import { config } from '../config';

class InterviewService {
  constructor() {
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Debug logging function
  debugLog(message, data = null) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[InterviewService Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Check if the interview_sessions table exists
   * @returns {Promise<boolean>} - Whether the table exists
   */
  async checkTableExists() {
    try {
      // In development mode, check if we're using the placeholder URL
      if (process.env.NODE_ENV === 'development' &&
          (supabase.supabaseUrl.includes('example.supabase.co') ||
           !supabase.supabaseUrl)) {
        console.log('Using fallback functionality in development mode (placeholder Supabase URL)');
        return false;
      }
      
      // Try to select from the table to see if it exists
      const { error } = await supabase
        .from('interview_sessions')
        .select('*')
        .limit(1);
      
      // If there's no error or the error is not about the table not existing,
      // then the table exists
      return !error || !error.message.includes('does not exist');
    } catch (error) {
      this.debugLog('Error checking if table exists', error);
      // In development mode with connection issues, always return false
      // to use the fallback functionality
      if (process.env.NODE_ENV === 'development' &&
          (error.message.includes('Failed to fetch') ||
           error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
        console.log('Using fallback functionality in development mode (connection error)');
        return false;
      }
      return false;
    }
  }

  /**
   * Get an existing interview session for a user
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object|null>} - The interview session data or null if not found
   */
  async getInterviewSession(sessionId) {
    this.debugLog('Getting interview session', { sessionId });
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        this.debugLog('Table does not exist or in development mode, returning mock data');
        // In development mode, return mock data for testing
        if (process.env.NODE_ENV === 'development') {
          return {
            session_id: sessionId,
            interview_data: [],
            ai_summary: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('interview_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();
      }, 3, 2000);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.debugLog('Interview session retrieved', data);
      return data;
    } catch (error) {
      this.debugLog('Error in getInterviewSession', error);
      console.error('Error getting interview session:', error);
      
      // In development mode, return mock data instead of throwing
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: returning mock data instead of throwing error');
        return {
          session_id: sessionId,
          interview_data: [],
          ai_summary: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Save an interview session
   * @param {string} sessionId - The session ID
   * @param {Object} interviewData - The interview data (questions and answers)
   * @param {Object} aiSummary - The AI-generated summary
   * @param {string} transcript - The full interview transcript
   * @returns {Promise<Object>} - The saved record
   */
  async saveInterviewSession(sessionId, interviewData, aiSummary, transcript) {
    this.debugLog('Saving interview session', { 
      sessionId, 
      interviewData, 
      aiSummary,
      transcriptLength: transcript?.length 
    });
    
    if (!sessionId || !interviewData) {
      throw new Error('Session ID and interview data are required');
    }

    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        this.debugLog('Table does not exist, skipping database save');
        // Return a mock result since we can't save to the database
        return {
          session_id: sessionId,
          interview_data: interviewData,
          ai_summary: aiSummary,
          transcript: transcript,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Check if a record already exists
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('interview_sessions')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();
      }, 3, 2000);

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let result;
      if (existingData) {
        // Update existing record
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('interview_sessions')
            .update({
              interview_data: interviewData,
              ai_summary: aiSummary,
              transcript: transcript,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .select();
        }, 3, 2000);

        if (error) throw error;
        result = data[0];
      } else {
        // Insert new record
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('interview_sessions')
            .insert({
              session_id: sessionId,
              interview_data: interviewData,
              ai_summary: aiSummary,
              transcript: transcript
            })
            .select();
        }, 3, 2000);

        if (error) throw error;
        result = data[0];
      }

      this.debugLog('Interview session saved successfully', result);
      return result;
    } catch (error) {
      this.debugLog('Error in saveInterviewSession', error);
      console.error('Error saving interview session:', error);
      throw error;
    }
  }

  /**
   * Generate interview questions based on user data
   * @param {string} sessionId - The session ID
   * @returns {Promise<Array>} - Array of interview questions
   */
  async generateInterviewQuestions(sessionId) {
    this.debugLog('Generating interview questions', { sessionId });
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    try {
      // In development mode with placeholder Supabase URL, use mock data
      if (process.env.NODE_ENV === 'development' &&
          (supabase.supabaseUrl.includes('example.supabase.co') ||
           !config.openai?.apiKey)) {
        this.debugLog('Using mock data in development mode');
        return this.getDefaultQuestions();
      }

      // Get user data from previous sections
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('*')
          .eq('session_id', sessionId);
      }, 3, 2000);

      if (error) {
        this.debugLog('Error fetching user data', error);
        return this.getDefaultQuestions();
      }

      // Extract relevant data for question generation
      const userData = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          userData[item.section_name] = item.input_data;
        });
        this.debugLog('User data retrieved for question generation', userData);
      } else {
        this.debugLog('No user data found, using default questions');
        return this.getDefaultQuestions();
      }

      // Get OpenAI API key from config
      const apiKey = config.openai?.apiKey;
      if (!apiKey) {
        this.debugLog('OpenAI API key is not available, using default questions');
        return this.getDefaultQuestions();
      }

      // Generate questions using OpenAI
      try {
        const result = await openaiService.generateInterviewQuestions(userData, apiKey);
        this.debugLog('Questions generated successfully', result);
        return result.questions;
      } catch (error) {
        this.debugLog('Error generating questions with OpenAI', error);
        return this.getDefaultQuestions();
      }
    } catch (error) {
      this.debugLog('Error in generateInterviewQuestions', error);
      console.error('Error generating interview questions:', error);
      return this.getDefaultQuestions();
    }
  }

  /**
   * Get default interview questions as fallback
   * @returns {Array} - Array of default questions
   */
  getDefaultQuestions() {
    return [
      "Tell me about your project idea and what problem it solves.",
      "How does your solution use AI technology?",
      "What were the biggest challenges you faced during development?",
      "How did you incorporate feedback to improve your solution?",
      "What would you do differently if you were to start over?"
    ];
  }

  /**
   * Generate an interview summary
   * @param {Array} interviewData - Array of question/answer pairs
   * @returns {Promise<Object>} - Summary object
   */
  async generateInterviewSummary(interviewData) {
    this.debugLog('Generating interview summary', { interviewData });
    
    if (!interviewData || !Array.isArray(interviewData)) {
      throw new Error('Interview data is required and must be an array');
    }

    try {
      // Get OpenAI API key from config
      const apiKey = config.openai?.apiKey;
      if (!apiKey) {
        this.debugLog('OpenAI API key is not available, using default summary');
        return this.getDefaultSummary(interviewData);
      }

      // Generate summary using OpenAI
      try {
        const summary = await openaiService.generateInterviewSummary(interviewData, apiKey);
        this.debugLog('Summary generated successfully', summary);
        return summary;
      } catch (error) {
        this.debugLog('Error generating summary with OpenAI', error);
        return this.getDefaultSummary(interviewData);
      }
    } catch (error) {
      this.debugLog('Error in generateInterviewSummary', error);
      console.error('Error generating interview summary:', error);
      return this.getDefaultSummary(interviewData);
    }
  }

  /**
   * Get a default interview summary as fallback
   * @param {Array} interviewData - Array of question/answer pairs
   * @returns {Object} - Default summary object
   */
  getDefaultSummary(interviewData) {
    return {
      conclusion: "Thank you for completing the interview. Your responses have been recorded.",
      key_points: interviewData.map(item => item.answer.substring(0, 100) + "..."),
      insights: ["Your project demonstrates creative problem-solving.", "Consider further user testing to refine your solution."],
      next_steps: ["Review your project goals", "Implement the feedback received", "Continue iterating on your solution"]
    };
  }

  /**
   * Adapt a question based on previous answer
   * @param {string} question - The original question
   * @param {string} previousAnswer - The previous answer
   * @returns {Promise<string>} - The adapted question
   */
  async adaptQuestion(question, previousAnswer) {
    this.debugLog('Adapting question', { question, previousAnswer });
    
    if (!question) {
      throw new Error('Question is required');
    }

    // If no previous answer, return the original question
    if (!previousAnswer) {
      return question;
    }

    try {
      // Get OpenAI API key from config
      const apiKey = config.openai?.apiKey;
      if (!apiKey) {
        this.debugLog('OpenAI API key is not available, using original question');
        return question;
      }

      // Adapt question using OpenAI
      try {
        const adaptedQuestion = await openaiService.adaptQuestion(question, previousAnswer, apiKey);
        this.debugLog('Question adapted successfully', { original: question, adapted: adaptedQuestion });
        return adaptedQuestion;
      } catch (error) {
        this.debugLog('Error adapting question with OpenAI', error);
        return question;
      }
    } catch (error) {
      this.debugLog('Error in adaptQuestion', error);
      console.error('Error adapting question:', error);
      return question;
    }
  }
}

export const interviewService = new InterviewService();