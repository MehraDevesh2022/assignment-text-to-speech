
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;


async function azureTextToSpeech(text) {
  return new Promise((resolve, reject) => {
   
    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
      return reject(new Error('Azure Speech credentials are not configured'));
    }

    // Create the speech config and audio config
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // Use a high-quality neural voice

    // Set output format to MP3
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

   
    let audioBuffer = [];
    
    // Create an audio configuration that outputs to our audio buffer
    const pullStream = sdk.AudioOutputStream.createPullStream();
    const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
    
    // Create the speech synthesizer
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          // Get the audio data from the result
          const audioData = result.audioData;
          resolve(Buffer.from(audioData));
        } else {
          const cancelationDetails = sdk.CancellationDetails.fromResult(result);
          reject(new Error(`Speech synthesis canceled: ${cancelationDetails.reason}`));
        }
        synthesizer.close();
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}

// Hugging Face Text-to-Speech function (using XTTS-v2)
async function huggingFaceTextToSpeech(text) {
  if (!HUGGINGFACE_API_TOKEN) {
    throw new Error('Hugging Face API token is not configured');
  }

  try {
    // Using coqui-ai/XTTS-v2 model for high-quality TTS
    const response = await axios({
      url: 'https://api-inference.huggingface.co/models/coqui-ai/XTTS-v2',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        inputs: {
          text: text,
          speaker_embeddings: null, // Use default voice
          language: 'en'
        }
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Failed to convert text to speech using Hugging Face: ${error.message}`);
  }
}

// Route for text-to-speech conversion
app.post('/text-to-speech', async (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let audioBuffer;
    
    if (model === 'azure') {
      audioBuffer = await azureTextToSpeech(text);
    } else if (model === 'huggingface') {
      audioBuffer = await huggingFaceTextToSpeech(text);
    } else {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Set the appropriate headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });

    // Send the audio data
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});