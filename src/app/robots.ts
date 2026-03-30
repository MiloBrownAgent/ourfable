import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/join/', '/respond/', '/welcome', '/redeem/'],
      },
    ],
    sitemap: 'https://ourfable.ai/sitemap.xml',
  }
}
