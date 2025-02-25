# Web Speech API Implementation for Video Transcription

## Overview

This implementation replaces the OpenAI Whisper API with the browser's built-in Web Speech API for video transcription. This eliminates the need for an OpenAI API key, making deployment simpler and more secure.

## Key Changes

1. **VideoRecorder Component**
   - Added Web Speech API integration for real-time transcription during recording
   - Added speech recognition support detection
   - Modified to pass transcription to VideoReflection component

2. **VideoService**
   - Added `setTranscription` method to store transcription from Web Speech API
   - Modified `transcribeAudio` method to use stored transcription when available
   - Kept OpenAI fallback for backward compatibility

3. **Configuration**
   - Removed OpenAI API key references from config files
   - Updated environment templates to remove OpenAI API key
   - Added new script for updating env-config.js to use Web Speech API

4. **Deployment**
   - Updated deploy.js to use Web Speech API
   - Removed the need for manual API key updates post-deployment

## Benefits

- **No API Key Required**: Eliminates the need for an OpenAI API key
- **Client-Side Solution**: Works entirely in the browser
- **Privacy**: Audio data stays in the browser
- **Real-Time Transcription**: Shows transcription as the user speaks
- **Simplified Deployment**: No need for post-deployment configuration

## Limitations

- **Browser Support**: Not all browsers support the Web Speech API
- **Accuracy**: May be less accurate than OpenAI's Whisper API
- **Language Support**: Limited language support compared to Whisper
- **Connection Required**: Requires an internet connection for most browsers

## Usage

1. **Recording a Video**
   - Navigate to the Video Reflection page
   - Click "Start Recording"
   - Speak clearly into your microphone
   - The transcription will appear in real-time
   - Click "Stop Recording" when finished

2. **Deployment**
   - Run `npm run deploy` to build and deploy the application
   - The Web Speech API will be automatically configured

## Browser Compatibility

The Web Speech API is supported in the following browsers:
- Chrome (desktop and Android)
- Edge
- Safari (desktop and iOS)
- Firefox (with limited support)

## Fallback Mechanism

If the Web Speech API is not supported or fails:
- The user will see a message indicating that transcription is not available
- The video will still be recorded and saved
- The user can manually enter a transcription if needed