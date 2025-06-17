import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    // Extract resource name from endpoint URL if not provided separately
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || 
                        (endpoint ? endpoint.match(/https:\/\/([^.]+)\.cognitiveservices\.azure\.com/)?.[1] : null);

    if (!apiKey || !endpoint) {
      console.error('Missing Azure OpenAI configuration:', {
        hasApiKey: !!apiKey,
        hasEndpoint: !!endpoint,
        resourceName: resourceName
      });
      return NextResponse.json(
        { error: 'Missing Azure OpenAI configuration. Please check AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.' },
        { status: 500 }
      );
    }

    if (!resourceName) {
      console.error('Could not determine Azure OpenAI resource name from endpoint:', endpoint);
      return NextResponse.json(
        { error: 'Could not determine Azure OpenAI resource name. Please check your AZURE_OPENAI_ENDPOINT format.' },
        { status: 500 }
      );
    }

    // For Azure OpenAI Realtime API, we can directly use the API key
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