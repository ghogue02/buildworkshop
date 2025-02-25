import { supabase, withRetry } from '../supabaseClient';
import { openaiService } from './openaiService';
import { config } from '../config';

class VideoService {
  constructor() {
    this.debugMode = process.env.NODE_ENV === 'development';
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
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `${sessionId}_${timestamp}.webm`;
      const filePath = `videos/${filename}`;
      
      this.debugLog('Generated file path', filePath);

      // Upload to Supabase storage
      const { data, error } = await withRetry(async () => {
        return await supabase.storage
          .from('user-content')
          .upload(filePath, videoBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'video/webm'
          });
      }, 3, 2000);

      if (error) {
        this.debugLog('Error uploading video', error);
        throw error;
      }

      this.debugLog('Video uploaded successfully', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      this.debugLog('Error in uploadVideo', error);
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Transcribe a video using OpenAI's Whisper API
   * @param {Blob} audioBlob - The audio blob to transcribe
   * @returns {Promise<string>} - The transcription text
   */
  async transcribeAudio(audioBlob) {
    this.debugLog('Transcribing audio', { size: audioBlob.size });
    
    if (!audioBlob) {
      throw new Error('Audio blob is required');
    }

    try {
      // Initialize OpenAI with API key from config
      const apiKey = config.openai.apiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key is not available');
      }
      
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
      this.debugLog('Error in transcribeAudio', error);
      console.error('Error transcribing audio:', error);
      throw error;
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