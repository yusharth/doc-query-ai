import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Session API called - checking environment variables...');
    
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;
    const webrtcUrl = process.env.AZURE_OPENAI_WEBRTC_URL;

    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      hasEndpoint: !!endpoint,
      hasResourceName: !!resourceName,
      hasWebrtcUrl: !!webrtcUrl,
      endpoint: endpoint ? endpoint.substring(0, 50) + '...' : 'undefined'
    });

    if (!apiKey) {
      console.error('AZURE_OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'Missing AZURE_OPENAI_API_KEY environment variable' },
        { status: 500 }
      );
    }

    if (!endpoint) {
      console.error('AZURE_OPENAI_ENDPOINT is missing');
      return NextResponse.json(
        { error: 'Missing AZURE_OPENAI_ENDPOINT environment variable' },
        { status: 500 }
      );
    }

    // Extract resource name from endpoint URL if not provided separately
    let finalResourceName = resourceName;
    if (!finalResourceName && endpoint) {
      const match = endpoint.match(/https:\/\/([^.]+)\.cognitiveservices\.azure\.com/);
      finalResourceName = match?.[1];
    }

    if (!finalResourceName) {
      console.error('Could not determine Azure OpenAI resource name');
      return NextResponse.json(
        { error: 'Could not determine Azure OpenAI resource name. Please check your AZURE_OPENAI_ENDPOINT format or set AZURE_OPENAI_RESOURCE_NAME.' },
        { status: 500 }
      );
    }

    console.log('Session created successfully for resource:', finalResourceName);

    return NextResponse.json({
      client_secret: {
        value: apiKey
      },
      resource_name: finalResourceName,
      webrtc_url: webrtcUrl
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}