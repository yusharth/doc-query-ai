import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;

    if (!apiKey || !endpoint || !resourceName) {
      return NextResponse.json(
        { error: 'Missing Azure OpenAI configuration' },
        { status: 500 }
      );
    }

    // Create a session token for the client
    const response = await fetch(`${endpoint}/openai/realtime?api-version=2024-10-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview',
        voice: process.env.AZURE_OPENAI_VOICE || 'verse',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create session:', errorText);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      client_secret: {
        value: data.client_secret?.value || apiKey
      },
      resource_name: resourceName
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}