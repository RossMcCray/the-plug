import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { images, niche } = await request.json();

    if (!images?.length || !niche?.trim()) {
      return NextResponse.json({ error: 'images and niche are required' }, { status: 400 });
    }

    if (images.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const imageBlocks: Anthropic.ImageBlockParam[] = images.map(
      (img: { data: string; mediaType: string }) => {
        if (!validTypes.includes(img.mediaType)) {
          throw new Error(`Invalid media type: ${img.mediaType}`);
        }
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: img.data,
          },
        };
      }
    );

    const prompt = `Analyze this TikTok slideshow and:
1. Identify the main hook used in the first slide.
2. Explain why this hook works (curiosity / pain point / relatability).
3. Write 7 hook variations for my niche: ${niche.trim()}.
4. Give me 5 specific Pinterest search queries to find background images that match this aesthetic.

Format your response as valid JSON only, with this exact structure — no markdown, no extra text:
{
  "mainHook": "...",
  "whyItWorks": "...",
  "variations": ["hook1", "hook2", "hook3", "hook4", "hook5", "hook6", "hook7"],
  "pinterestQueries": ["query1", "query2", "query3", "query4", "query5"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [...imageBlocks, { type: 'text', text: prompt }],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse JSON from Claude response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract hooks';
    console.error('[extract-hooks]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
