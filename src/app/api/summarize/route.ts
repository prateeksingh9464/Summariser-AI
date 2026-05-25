import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text, url, length, tone } = await req.json();

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key Missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let content = '';

    if (url) {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      try {
        new URL(cleanUrl);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const headers: Record<string, string> = {};
      if (process.env.JINA_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
      }

      try {
        const jinaRes = await fetch('https://r.jina.ai/' + cleanUrl, {
          headers,
        });

        if (!jinaRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch content from the URL' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        content = await jinaRes.text();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Failed to connect to extraction service' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (text) {
      content = text.trim();
    }

    if (!content || content.length < 10) {
      return new Response(JSON.stringify({ error: 'Text too short to summarize' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let lengthInstruction = 'The summary must be balanced and structured, summarizing key aspects in a few paragraphs.';
    if (length === 'brief') {
      lengthInstruction = 'The summary must be extremely concise, containing at most 2-3 sentences.';
    } else if (length === 'detailed') {
      lengthInstruction = 'The summary must be comprehensive and highly detailed, covering all main topics, context, and supporting points.';
    }

    let toneInstruction = 'The style must be action-oriented, emphasizing key takeaways, lessons, and next steps.';
    if (tone === 'technical') {
      toneInstruction = 'The style must be technical, emphasizing facts, logic, and precise terminology.';
    } else if (tone === 'explanatory') {
      toneInstruction = 'The style must be explanatory, using simple, clear, and easy-to-understand language.';
    }

    const systemPrompt = `You are an advanced text summarizer. You must format your output in Markdown. Use bold headings for key sections, bullet points for key takeaways, and end with a distinct "Key Takeaway" section summarizing the main point in a single concise sentence.
    
    Constraints:
    - ${lengthInstruction}
    - ${toneInstruction}`;

    const google = createGoogleGenerativeAI({ apiKey });

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Please summarize the following content:\n\n${content}`,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during summary generation' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
