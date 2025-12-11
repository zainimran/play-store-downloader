import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('play.google.com')) {
      return NextResponse.json({ error: 'Invalid URL. Must be a Google Play Store URL.' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch page: ${response.status} ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Inject base tag to make relative links work
    $('head').prepend(`<base href="${parsedUrl.origin}">`);

    // Optional: Try to fix some common issues with scraped pages
    // For example, ensuring images have absolute paths if they don't already (Play Store usually does, but just in case)
    
    return new NextResponse($.html(), {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="play-store-page.html"`,
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
