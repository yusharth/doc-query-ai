import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use Azure OpenAI API key and resource name from environment variables
    const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const AZURE_OPENAI_RESOURCE_NAME = process.env.AZURE_OPENAI_RESOURCE_NAME;
    
    if (!AZURE_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Azure OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!AZURE_OPENAI_RESOURCE_NAME) {
      return NextResponse.json(
        { error: 'Azure OpenAI resource name not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://${AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com/openai/realtimeapi/sessions?api-version=2025-04-01-preview`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AZURE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-realtime-preview',
          voice: 'coral',
          modalities: ['audio', 'text'],
          turn_detection: null,
          temperature: 0.7,
          input_audio_transcription: {
            model: 'whisper-1',
            language: 'en'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Azure OpenAI API error:', errorData);
      return NextResponse.json(
        { error: `Azure OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: `Failed to create session: ${error}` },
      { status: 500 }
    );
  }
}