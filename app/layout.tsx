import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0EA5A5',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ourfable.ai'),
  title: {
    default: 'OurFable — Personalized Animated Storybooks for Kids',
    template: '%s — OurFable.ai',
  },
  description: 'Upload one photo and get a personalized, animated digital storybook in under 3 minutes. AI-powered custom children\'s books with cinematic illustrations. $14.99.',
  keywords: [
    'personalized children\'s book',
    'custom storybook for kids',
    'AI storybook',
    'animated storybook',
    'personalized gift for kids',
    'custom kids book with photo',
    'personalized storybook',
    'children book gift',
    'AI children\'s book',
    'digital storybook',
  ],
  authors: [{ name: 'OurFable.ai' }],
  creator: 'OurFable.ai',
  publisher: 'OurFable.ai',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'OurFable — Personalized Animated Storybooks for Kids',
    description: 'Upload one photo and get a personalized, animated storybook with cinematic illustrations in under 3 minutes. The perfect custom gift for kids ages 2-10.',
    images: [{ url: '/samples/book-mockup-reading.jpg', width: 1200, height: 630, alt: 'OurFable personalized animated storybook for kids' }],
    type: 'website',
    siteName: 'OurFable.ai',
    url: 'https://ourfable.ai',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurFable — Personalized Animated Storybooks',
    description: 'Upload one photo. Get a personalized, animated storybook in minutes. Custom kids books with cinematic AI illustrations.',
    images: [{ url: '/samples/book-mockup-reading.jpg', alt: 'OurFable personalized animated storybook' }],
  },
  alternates: {
    canonical: 'https://ourfable.ai',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://ourfable.ai/#organization',
        name: 'OurFable.ai',
        url: 'https://ourfable.ai',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ourfable.ai/samples/book-mockup-reading.jpg',
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://ourfable.ai/#website',
        url: 'https://ourfable.ai',
        name: 'OurFable.ai',
        publisher: { '@id': 'https://ourfable.ai/#organization' },
      },
      {
        '@type': 'Product',
        name: 'Personalized Animated Storybook',
        description: 'AI-powered personalized animated digital storybook for kids. Upload a photo, get a 12-page cinematic storybook in under 3 minutes.',
        image: 'https://ourfable.ai/samples/book-mockup-reading.jpg',
        brand: { '@type': 'Brand', name: 'OurFable.ai' },
        offers: {
          '@type': 'Offer',
          price: '14.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://ourfable.ai',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          reviewCount: '3',
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
