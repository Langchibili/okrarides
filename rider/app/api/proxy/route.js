/**
 * API Proxy Route
 * Proxies requests from the frontend to the external API backend
 * This avoids CORS issues by routing requests through Next.js backend
 */

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', headers: clientHeaders = {}, data } = body;

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `${EXTERNAL_API_URL}${endpoint}`;

    const fetchHeaders = {
      ...clientHeaders,
    };

    // Only set Content-Type for requests with data
    if (data && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
      method: method.toUpperCase(),
      headers: fetchHeaders,
    };

    if (data) {
      fetchOptions.body = JSON.stringify(data);
    }

    console.log(`[API Proxy] ${method.toUpperCase()} ${url}`, { headers: fetchHeaders });

    const response = await fetch(url, fetchOptions);
    const responseData = await response.text();

    console.log(`[API Proxy Response] Status: ${response.status}`);

    return new Response(
      responseData || JSON.stringify({}),
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to proxy request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const headers = {};

    // Extract authorization header if present
    const authHeader = searchParams.get('auth');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `${EXTERNAL_API_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const responseData = await response.text();

    return new Response(
      responseData || JSON.stringify({}),
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to proxy request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
