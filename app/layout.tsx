import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OurFable.ai — Personalized Storybooks',
  description: 'Upload a photo, dream up an adventure, and watch as AI creates a beautifully illustrated personalized storybook.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
