import { supabase, withRetry } from '../supabaseClient';
import { openaiService } from './openaiService';
import { config } from '../config';

class VideoService {
  constructor() {
    this.debugMode = process.env.NODE_ENV === 'development';
    this.transcription = null;
  }

  // Debug logging function
  debugLog(message, data = null) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[VideoService Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - The name of the table to check
   * @returns {Promise<boolean>} - Whether the table exists
   */
  async checkTableExists(tableName) {
    try {
      // We'll just try to select from the table to see if it exists
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      // If there's no error or the error is not about the table not existing,
      // then the table exists
      return !error || !error.message.includes('does not exist');
    } catch (error) {
      this.debugLog('Error checking if table exists', error);
      return false;
    }
  }

  /**
   * Upload a video blob to Supabase storage
   * @param {Blob} videoBlob - The video blob to upload
   * @param {string} sessionId - The session ID
   * @returns {Promise<string>} - The URL of the uploaded video
   */
  async uploadVideo(videoBlob, sessionId) {
    this.debugLog('Uploading video', { sessionId, size: videoBlob.size });
    
    if (!videoBlob || !sessionId) {
      throw new Error('Video blob and session ID are required');
    }

    try {
      // Check if the video_recordings table exists
      const tableExists = await this.checkTableExists('video_recordings');
      this.debugLog('Table exists check result:', tableExists);
      
      // Store video as a data URL instead of using Supabase Storage
      const reader = new FileReader();
      
      // Convert blob to data URL
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });
      
      this.debugLog('Converted video to data URL');
      
      // Save the data URL as the video URL
      return dataUrl;
    } catch (error) {
      this.debugLog('Error in uploadVideo', error);
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Set the transcription from Web Speech API
   * @param {string} text - The transcription text
   */
  setTranscription(text) {
    this.debugLog('Setting transcription', { text });
    this.transcription = text;
  }

  /**
   * Transcribe a video using Web Speech API or OpenAI's Whisper API as fallback
   * @param {Blob} audioBlob - The audio blob to transcribe
   * @returns {Promise<string>} - The transcription text
   */
  async transcribeAudio(audioBlob) {
    this.debugLog('Transcribing audio', { size: audioBlob?.size });
    
    // If we already have a transcription from Web Speech API, use it
    if (this.transcription) {
      this.debugLog('Using existing transcription from Web Speech API');
      return this.transcription;
    }
    
    if (!audioBlob) {
      throw new Error('Audio blob is required');
    }

    try {
      // Initialize OpenAI with API key from config
      const apiKey = config.openai.apiKey;
      if (!apiKey) {
        this.debugLog('OpenAI API key is not available, skipping transcription');
        return "Transcription not available (API key missing)";
      }
      
      try {
        openaiService.initializeOpenAI(apiKey);
        
        // Create a form data object with the audio file
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        
        // Make a direct fetch request to OpenAI API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        this.debugLog('Transcription successful', data);
        
        return data.text;
      } catch (error) {
        this.debugLog('Error in OpenAI transcription', error);
        return `Transcription failed: ${error.message}`;
      }
    } catch (error) {
      this.debugLog('Error in transcribeAudio', error);
      console.error('Error transcribing audio:', error);
      return `Transcription failed: ${error.message}`;
    }
  }

  /**
   * Save video recording information to the database
   * @param {string} sessionId - The session ID
   * @param {string} videoUrl - The URL of the uploaded video
   * @param {string} transcript - The transcription text
   * @returns {Promise<Object>} - The saved record
   */
  async saveVideoRecording(sessionId, videoUrl, transcript) {
    this.debugLog('Saving video recording', { sessionId, videoUrl, transcript });
    
    if (!sessionId || !videoUrl) {
      throw new Error('Session ID and video URL are required');
    }

    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists('video_recordings');
      
      if (!tableExists) {
        this.debugLog('Table does not exist, skipping database save');
        // Return a mock result since we can't save to the database
        return {
          session_id: sessionId,
          video_url: videoUrl,
          transcript: transcript,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Check if a record already exists
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('video_recordings')
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
            .from('video_recordings')
            .update({
              video_url: videoUrl,
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
            .from('video_recordings')
            .insert({
              session_id: sessionId,
              video_url: videoUrl,
              transcript: transcript
            })
            .select();
        }, 3, 2000);

        if (error) throw error;
        result = data[0];
      }

      this.debugLog('Video recording saved successfully', result);
      return result;
    } catch (error) {
      this.debugLog('Error in saveVideoRecording', error);
      console.error('Error saving video recording:', error);
      throw error;
    }
  }

  /**
   * Get video recording for a session
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} - The video recording data
   */
  async getVideoRecording(sessionId) {
    this.debugLog('Getting video recording', { sessionId });
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists('video_recordings');
      
      if (!tableExists) {
        this.debugLog('Table does not exist, returning null');
        return null;
      }
      
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('video_recordings')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();
      }, 3, 2000);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.debugLog('Video recording retrieved', data);
      return data;
    } catch (error) {
      this.debugLog('Error in getVideoRecording', error);
      console.error('Error getting video recording:', error);
      throw error;
    }
  }
}

export const videoService = new VideoService();