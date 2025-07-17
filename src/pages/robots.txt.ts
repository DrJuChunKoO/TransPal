import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.href.replace(/\/$/, '') || 'https://transpal.example.com';
  
  const robotsTxt = `# TransPal Robots.txt
# 允許所有搜尋引擎爬取網站內容

User-agent: *
Allow: /

# 網站地圖位置
Sitemap: ${baseUrl}/sitemap.xml

# 爬取延遲設定（建議值）
Crawl-delay: 1

# 特殊指令
# 允許搜尋引擎索引所有會議記錄
Allow: /speeches/

# 禁止爬取可能的臨時或測試檔案
Disallow: /test*
Disallow: /*.tmp
Disallow: /temp/

# 搜尋引擎特定設定
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 2

# 社交媒體爬蟲
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# 其他常見爬蟲
User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};