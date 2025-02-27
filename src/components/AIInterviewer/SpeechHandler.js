import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Phoneme to viseme mapping
 * Maps English phonemes to viseme types for lip sync
 */
const PHONEME_TO_VISEME = {
  // Silence
  '': 'sil',
  ' ': 'sil',
  '.': 'sil',
  ',': 'sil',
  '?': 'sil',
  '!': 'sil',
  
  // Bilabial consonants (lips pressed together)
  'p': 'PP',
  'b': 'PP',
  'm': 'PP',
  
  // Labiodental consonants (lower lip against upper teeth)
  'f': 'FF',
  'v': 'FF',
  
  // Dental consonants (tongue against teeth)
  'th': 'TH',
  'dh': 'TH',
  
  // Alveolar consonants (tongue near/touching the ridge behind teeth)
  't': 'DD',
  'd': 'DD',
  'n': 'nn',
  's': 'SS',
  'z': 'SS',
  'l': 'DD',
  
  // Postalveolar consonants
  'sh': 'CH',
  'zh': 'CH',
  'ch': 'CH',
  'j': 'CH',
  
  // Velar consonants (back of tongue against soft palate)
  'k': 'kk',
  'g': 'kk',
  'ng': 'nn',
  
  // Glottal consonants
  'h': 'kk',
  
  // Approximants
  'r': 'RR',
  'w': 'RR',
  'y': 'I',
  
  // Vowels
  'a': 'aa',
  'aa': 'aa',
  'ae': 'aa',
  'ah': 'aa',
  'ao': 'O',
  'aw': 'aa',
  'ax': 'aa',
  'ay': 'aa',
  'e': 'E',
  'eh': 'E',
  'er': 'E',
  'ey': 'E',
  'i': 'I',
  'ih': 'I',
  'iy': 'I',
  'o': 'O',
  'oe': 'O',
  'oh': 'O',
  'ow': 'O',
  'oy': 'O',
  'u': 'U',
  'uh': 'U',
  'uw': 'U'
};

/**
 * Analyzes text to estimate phoneme timing
 * @param {string} text - The text to analyze
 * @returns {Array} - Array of word objects with viseme data
 */
const analyzeTextToPhonemes = (text) => {
  const words = text.split(/\s+/);
  const now = Date.now() / 1000; // Current time in seconds
  const averageWordDuration = 0.3; // Average duration of a word in seconds
  const visemeData = [];
  
  let currentTime = now;
  
  words.forEach((word, wordIndex) => {
    // Skip empty words
    if (!word.trim()) return;
    
    const wordStart = currentTime;
    const wordDuration = word.length * 0.05 + 0.1; // Adjust duration based on word length
    const wordEnd = wordStart + wordDuration;
    
    // Break word into phonemes (simplified - in a real app, use a phoneme dictionary)
    const phonemes = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      
      // Check for digraphs (two-character phonemes)
      if (i < word.length - 1) {
        const digraph = char + word[i + 1].toLowerCase();
        if (['th', 'sh', 'ch', 'ph', 'wh', 'ng'].includes(digraph)) {
          phonemes.push(digraph);
          i++; // Skip the next character
          continue;
        }
      }
      
      phonemes.push(char);
    }
    
    // Create visemes from phonemes
    const visemes = [];
    const phonemeDuration = wordDuration / (phonemes.length + 2); // +2 for silence at start/end
    
    // Add initial silence
    visemes.push({
      type: 'sil',
      start: wordStart,
      end: wordStart + phonemeDuration * 0.5
    });
    
    // Add phoneme visemes
    phonemes.forEach((phoneme, i) => {
      const visemeType = PHONEME_TO_VISEME[phoneme] || 'aa'; // Default to 'aa' if not found
      const start = wordStart + phonemeDuration * 0.5 + (i * phonemeDuration);
      const end = start + phonemeDuration;
      
      visemes.push({
        type: visemeType,
        start,
        end
      });
    });
    
    // Add ending silence
    visemes.push({
      type: 'sil',
      start: wordEnd - phonemeDuration * 0.5,
      end: wordEnd
    });
    
    visemeData.push({
      word,
      start: wordStart,
      end: wordEnd,
      visemes
    });
    
    currentTime = wordEnd + 0.1; // Add a small pause between words
  });
  
  return visemeData;
};

/**
 * Custom hook for handling speech recognition and synthesis
 * @param {Object} options - Configuration options
 * @param {Function} options.onTranscript - Callback for transcript updates
 * @param {Function} options.onSpeechEnd - Callback for when speech recognition ends
 * @param {Function} options.onVisemeData - Callback for viseme data (for lip sync)
 * @returns {Object} - Speech handler methods and state
 */
export const useSpeechHandler = ({ onTranscript, onSpeechEnd, onVisemeData }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setError('Speech recognition is not supported in this browser');
      console.warn('Speech recognition is not supported in this browser');
      return;
    }
    
    // Initialize speech recognition
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    // Set up speech recognition event handlers
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
      if (onTranscript) {
        onTranscript(currentTranscript);
      }
    };
    
    recognitionRef.current.onend = () => {
      if (isListening) {
        // If we're still supposed to be listening, restart recognition
        // (it can stop automatically after periods of silence)
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Error restarting speech recognition:', e);
        }
      } else {
        // If we intentionally stopped listening, call the callback
        if (onSpeechEnd) {
          onSpeechEnd(transcript);
        }
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
    };
    
    // Initialize speech synthesis
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    } else {
      console.warn('Speech synthesis is not supported in this browser');
    }
    
    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping recognition
        }
      }
      
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isListening, onSpeechEnd, onTranscript, transcript]);
  
  // Start listening
  const startListening = useCallback(() => {
    if (!speechSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    setError(null);
    setIsListening(true);
    setTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log('Speech recognition started');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError(`Error starting speech recognition: ${error.message}`);
        setIsListening(false);
      }
    }
  }, [speechSupported]);
  
  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }, []);
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 1.0,
    rate: 0.9,
    voice: null
  });

  // Update voice settings
  const updateVoiceSettings = useCallback((settings) => {
    setVoiceSettings(prev => ({
      ...prev,
      ...settings
    }));
  }, []);

  // Speak text with enhanced viseme generation and voice customization
  const speak = useCallback((text) => {
    if (!synthRef.current) {
      setError('Speech synthesis is not supported in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice based on settings or find default
    if (voiceSettings.voice) {
      utterance.voice = voiceSettings.voice;
    } else {
      // Try to find a good default voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang === 'en-US' && v.name.includes('Google') && !v.name.includes('Female')
      ) ||
      voices.find(v => v.lang === 'en-US' && !v.name.includes('Female')) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      }
    }
    
    // Apply voice settings
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = 1.0;
    
    // Set event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('Speech started');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('Speech ended');
      
      // Clear viseme data when speech ends
      if (onVisemeData) {
        onVisemeData([]);
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
      
      // Clear viseme data on error
      if (onVisemeData) {
        onVisemeData([]);
      }
    };
    
    // Generate enhanced viseme data for lip sync using our phoneme analyzer
    if (onVisemeData) {
      const visemeData = analyzeTextToPhonemes(text);
      onVisemeData(visemeData);
      
      // Debug viseme data
      console.log('Generated viseme data for:', text.substring(0, 20) + '...');
    }
    
    // Speak the text
    synthRef.current.speak(utterance);
    
    // Return a function that can cancel the speech
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
        if (onVisemeData) {
          onVisemeData([]);
        }
      }
    };
  }, [onVisemeData, voiceSettings.pitch, voiceSettings.rate, voiceSettings.voice]);
  
  // Get available voices
  const getVoices = useCallback(() => {
    if (!synthRef.current) {
      return [];
    }
    
    return synthRef.current.getVoices();
  }, []);
  
  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    speechSupported,
    startListening,
    stopListening,
    speak,
    getVoices,
    updateVoiceSettings,
    voiceSettings
  };
};

export default useSpeechHandler;