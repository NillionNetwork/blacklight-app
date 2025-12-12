import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route to proxy Conduit Indexer requests
 * This keeps the API key secure on the server and prevents exposure to clients
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get the API key from server-side environment variable (not NEXT_PUBLIC_)
  const apiKey = process.env.INDEXER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Indexer API key not configured on server' },
      { status: 500 }
    );
  }

  // Get query and signatures from request
  const query = searchParams.get('query');
  const signatures = searchParams.getAll('signatures');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: query' },
      { status: 400 }
    );
  }

  // Build request to Conduit Indexer
  const indexerUrl = process.env.INDEXER_API_URL || 'https://indexing.conduit.xyz/v2/query';
  const params = new URLSearchParams({
    'api-key': apiKey,
    query,
  });

  // Add each signature as a separate parameter
  signatures.forEach((sig) => {
    params.append('signatures', sig);
  });

  const url = `${indexerUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Indexer API error:', errorText);
      return NextResponse.json(
        { error: `Indexer query failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the data as-is (client will handle transformation)
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying indexer request:', error);
    return NextResponse.json(
      { error: 'Failed to query indexer' },
      { status: 500 }
    );
  }
}
