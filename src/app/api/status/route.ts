export const runtime = 'edge';

export async function GET() {
  return new Response(
    JSON.stringify({
      googleConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      jinaConfigured: !!process.env.JINA_API_KEY,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
