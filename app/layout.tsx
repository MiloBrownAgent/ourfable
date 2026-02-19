import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OurFable.ai — Turn Your Child Into a Storybook Hero',
  description: 'Upload one photo and our AI creates a beautifully illustrated, personalized 12-page storybook in under 3 minutes. Digital or premium hardcover.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ourfable.vercel.app'),
  openGraph: {
    title: 'OurFable.ai — Turn Your Child Into a Storybook Hero',
    description: 'Upload one photo. Get a personalized, illustrated storybook in minutes. The perfect gift for any child.',
    images: ['/samples/book-mockup-reading.jpg'],
    type: 'website',
    siteName: 'OurFable.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurFable.ai — Personalized Storybooks',
    description: 'Upload one photo. Get a personalized, illustrated storybook in minutes.',
    images: ['/samples/book-mockup-reading.jpg'],
  },
  keywords: ['personalized storybook', 'children book', 'AI storybook', 'custom kids book', 'personalized gift', 'children gift'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
