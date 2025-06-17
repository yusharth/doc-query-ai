import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;

    if (!apiKey || !endpoint || !resourceName) {
      console.error('Missing Azure OpenAI configuration:', {
        hasApiKey: !!apiKey,
        hasEndpoint: !!endpoint,
        hasResourceName: !!resourceName
      });
      return NextResponse.json(
        { error: 'Missing Azure OpenAI configuration' },
        { status: 500 }
      );
    }

    // For Azure OpenAI Realtime API, we don't need to create a session token
    // We can directly use the API key as the client secret
    return NextResponse.json({
      client_secret: {
        value: apiKey
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