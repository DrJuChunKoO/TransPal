import type { APIRoute } from 'astro';
import { getSpeeches, getSpeech } from '../utils/speeches';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('Site URL is required for sitemap generation');
  }

  const baseUrl = site.href.replace(/\/$/, '');
  
  try {
    // Get all speeches
    const speeches = await getSpeeches();
    
    // Generate sitemap entries
    const sitemapEntries: string[] = [];
    
    // Add homepage
    sitemapEntries.push(`
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`);
    
    // Add static pages
    const staticPages = [
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/edit-guide', priority: '0.7', changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      sitemapEntries.push(`
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`);
    });
    
    // Add speech pages
    for (const speechMeta of speeches) {
      try {
        const speech = await getSpeech(speechMeta.filename);
        if (speech && speech.info) {
          // Add main speech page
          sitemapEntries.push(`
  <url>
    <loc>${baseUrl}/speeches/${speechMeta.filename}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date(speech.info.date).toISOString()}</lastmod>
  </url>`);
          
          // Add individual message pages
          if (speech.content && Array.isArray(speech.content)) {
            const speechMessages = speech.content.filter(item => 
              item && 
              typeof item === 'object' && 
              item.type === 'speech' && 
              item.id && 
              typeof item.id === 'string'
            );
            
            speechMessages.forEach(message => {
              sitemapEntries.push(`
  <url>
    <loc>${baseUrl}/speeches/${speechMeta.filename}/${message.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date(speech.info.date).toISOString()}</lastmod>
  </url>`);
            });
          }
        }
      } catch (error) {
        console.warn(`Error processing speech ${speechMeta.filename} for sitemap:`, error);
        // Continue with other speeches
      }
    }
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${sitemapEntries.join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return minimal sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
};