import type { Metadata, Viewport } from 'next';
import './globals.css';
import MetaPixel from '@/components/MetaPixel';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4A1D96',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ourfable.ai'),
  title: {
    default: 'OurFable — A Vault of Family Voices for Your Child',
    template: '%s — OurFable.ai',
  },
  description:
    'OurFable automatically interviews grandparents, godparents, and family friends each month — one question at a time — and stores their answers in a private vault your child will read when they\'re older. The most meaningful gift a new parent can give.',
  keywords: [
    'letters to my child from family',
    'time capsule for kids',
    'grandparent legacy gift',
    'preserve family stories for children',
    'meaningful gift for new parents',
    'family memory platform',
    'grandparent stories app',
    'family voice vault',
    'preserve family voices',
    'letters from grandparents to grandchildren',
    'how to collect family stories',
    'family history for children',
    'meaningful baby shower gift',
    'gift for new baby',
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
    title: 'OurFable — A Vault of Family Voices for Your Child',
    description:
      'OurFable automatically interviews grandparents, godparents, and family friends each month. Their answers go into a private vault your child reads when they\'re older. Preserve the voices that matter most.',
    images: [
      {
        url: '/samples/book-mockup-reading.jpg',
        width: 1200,
        height: 630,
        alt: 'OurFable family memory vault for children',
      },
    ],
    type: 'website',
    siteName: 'OurFable.ai',
    url: 'https://ourfable.ai',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurFable — A Vault of Family Voices for Your Child',
    description:
      'One question per month. Grandparents, godparents, old friends. Their answers stored privately for your child to read when they\'re older.',
    images: [
      {
        url: '/samples/book-mockup-reading.jpg',
        alt: 'OurFable family memory vault',
      },
    ],
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
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@ourfable.ai',
          contactType: 'customer support',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://ourfable.ai/#website',
        url: 'https://ourfable.ai',
        name: 'OurFable.ai',
        description:
          'A platform that automatically interviews grandparents, godparents, and family friends each month, stores their answers in a private vault, and delivers them to your child when they are older.',
        publisher: { '@id': 'https://ourfable.ai/#organization' },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'OurFable',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        description:
          'A platform that automatically interviews grandparents, godparents, and family members each month — one carefully crafted question per person — stores their answers in a private vault, and delivers them to your child when they are older.',
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          url: 'https://ourfable.ai',
        },
        publisher: { '@id': 'https://ourfable.ai/#organization' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is OurFable?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'OurFable is a family memory platform. Parents add the people who matter most to their child — grandma, a godparent, an old friend — and OurFable automatically sends each person one carefully crafted question per month. Their answers are stored privately in a vault the child will read when they are older.',
            },
          },
          {
            '@type': 'Question',
            name: 'Who sends the questions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'OurFable sends the questions automatically, via email. Each question is tailored to the contributor\'s relationship to the child — a grandparent gets different questions than an uncle or a family friend. Parents never have to ask anyone themselves.',
            },
          },
          {
            '@type': 'Question',
            name: 'When do children receive the messages?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The vault accumulates privately over the years. Parents choose when their child receives access — at a milestone birthday, when they leave home, or at another meaningful moment the parent selects.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is this a gift?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. OurFable is one of the most meaningful gifts a new parent can receive. You give a child a collection of voices from the people who loved them when they were small — voices that might otherwise be lost forever.',
            },
          },
          {
            '@type': 'Question',
            name: 'Who can contribute to the vault?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Anyone the parent adds: grandparents, godparents, aunts, uncles, old friends, neighbors, mentors, and family friends. Each person receives a unique monthly question tailored to their specific relationship with the child.',
            },
          },
          {
            '@type': 'Question',
            name: 'What makes a meaningful gift for a new parent?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'OurFable is widely considered one of the most meaningful gifts for new parents because it does something no blanket or toy can: it captures the voices of family and friends while they are still here, and preserves them for the child to discover later. It requires no effort from the parent once set up.',
            },
          },
        ],
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
      <body className="min-h-screen">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
