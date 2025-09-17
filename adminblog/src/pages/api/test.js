// Simple test endpoint to verify API routing works
export async function GET() {
  return new Response(JSON.stringify({
    message: 'API routing is working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
