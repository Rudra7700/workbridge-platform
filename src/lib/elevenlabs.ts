/**
 * ElevenLabs Text-to-Speech Service
 * Provides voice synthesis capabilities using ElevenLabs API
 */

// Language to voice mapping for ElevenLabs multilingual voices
const LANGUAGE_VOICE_MAP: Record<string, string> = {
    'English': 'Rachel',       // Professional American female
    'Hindi': 'Aarav',          // Indian male voice
    'Bengali': 'Aarav',        // Indian male voice
    'Tamil': 'Aarav',          // Indian male voice
    'Telugu': 'Aarav',         // Indian male voice
    'Marathi': 'Aarav',        // Indian male voice
    'Gujarati': 'Aarav',       // Indian male voice
    'Kannada': 'Aarav',        // Indian male voice
    'Malayalam': 'Aarav',      // Indian male voice
    'Punjabi': 'Aarav',        // Indian male voice
};

// Default voice if language not mapped
const DEFAULT_VOICE = 'Rachel';

/**
 * Get the appropriate voice ID for a given language
 */
export function getVoiceForLanguage(language: string): string {
    return LANGUAGE_VOICE_MAP[language] || DEFAULT_VOICE;
}

/**
 * Generate speech from text using ElevenLabs API
 * @param text - The text to convert to speech
 * @param language - Target language name (e.g., 'Hindi', 'English')
 * @returns Audio data as base64 data URL
 */
export async function textToSpeech(text: string, language: string): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const voiceName = getVoiceForLanguage(language);

    try {
        // Get voice ID by name
        const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': apiKey,
            },
        });

        if (!voicesResponse.ok) {
            throw new Error(`Failed to fetch voices: ${voicesResponse.statusText}`);
        }

        const voicesData = await voicesResponse.json();
        const voice = voicesData.voices.find((v: any) => v.name === voiceName);

        if (!voice) {
            throw new Error(`Voice '${voiceName}' not found`);
        }

        // Generate speech using the Eleven Multilingual v2 model
        const ttsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            throw new Error(`TTS generation failed: ${ttsResponse.statusText} - ${errorText}`);
        }

        // Convert response to base64 data URL
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

        return dataUrl;
    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        throw error;
    }
}

/**
 * Convert audio buffer to data URL for browser playback
 */
export function createAudioDataUrl(audioBuffer: ArrayBuffer, mimeType: string = 'audio/mpeg'): string {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    return `data:${mimeType};base64,${base64Audio}`;
}
