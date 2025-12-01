import { NextRequest, NextResponse } from 'next/server'

// Dev-only endpoint to reset localStorage (returns script to run in browser)
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Not available in production' },
        { status: 403 }
      )
    }

    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Reset Mock Data</title>
</head>
<body style="font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto;">
  <h1>Reset Mock Data</h1>
  <p>Click the button below to clear localStorage and reload mock data.</p>
  <button
    onclick="localStorage.removeItem('nilav_nodes'); document.getElementById('status').textContent = 'Cleared! Redirecting...'; setTimeout(() => window.location.href = '/nodes', 1000);"
    style="padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; background: #4a9eff; color: white; border: none; border-radius: 0.5rem;"
  >
    Clear & Reload
  </button>
  <p id="status" style="margin-top: 1rem; color: #666;"></p>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
