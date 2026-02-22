# OurFable.ai — Meta Pixel Setup (Next.js)

## Prerequisites

1. Create a Meta Pixel in [Events Manager](https://business.facebook.com/events_manager)
2. Copy your **Pixel ID** (looks like: `123456789012345`)

---

## Step 1: Install the Facebook Pixel SDK

### Option A: Script Tag (Simplest)

Create `src/components/MetaPixel.tsx`:

```tsx
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
```

### Step 2: Add to Root Layout

In `src/app/layout.tsx`:

```tsx
import MetaPixel from '@/components/MetaPixel';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
```

### Step 3: Add Environment Variable

In `.env.local`:

```
NEXT_PUBLIC_META_PIXEL_ID=YOUR_PIXEL_ID_HERE
```

Also add to Vercel environment variables (Settings → Environment Variables).

---

## Step 4: Track Conversion Events

### Lead Event (Email Signup)

Fire this when a user successfully submits their email to the waitlist. Add to your signup handler:

```tsx
// In your email signup form handler / API response callback:

const handleEmailSignup = async (email: string) => {
  // ... your existing signup logic ...

  // Fire Meta Pixel Lead event
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: 'waitlist_signup',
      content_category: 'waitlist',
    });
  }
};
```

### ViewContent Event (Optional — for retargeting later)

Fire when someone scrolls to a key section or watches a demo:

```tsx
// Optional: track meaningful engagement
if (typeof window !== 'undefined' && (window as any).fbq) {
  (window as any).fbq('track', 'ViewContent', {
    content_name: 'hero_section_viewed',
  });
}
```

---

## Step 5: Create a Pixel Helper Type (Optional)

Add to `src/types/global.d.ts`:

```ts
interface Window {
  fbq: (...args: any[]) => void;
}
```

---

## Step 6: Verify Installation

1. Install the [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
2. Visit ourfable.ai
3. Verify: green icon = PageView firing
4. Submit a test email signup
5. Verify: Lead event fires in Pixel Helper
6. Check Events Manager → Test Events tab to confirm events are received

---

## Events Summary

| Event | When It Fires | Purpose |
|---|---|---|
| PageView | Every page load/navigation | Track all visitors |
| Lead | Email signup submitted | Primary conversion for ads |
| ViewContent | (Optional) Key engagement | Retargeting audiences |

---

## Conversion API (Advanced — Skip for Now)

For better tracking accuracy (iOS 14.5+ privacy changes), you can add server-side Conversion API later. For a $400 validation test, client-side pixel is sufficient. Revisit if scaling.

---

## Pre-Launch Checklist

- [ ] Pixel ID added to `.env.local` and Vercel
- [ ] MetaPixel component added to root layout
- [ ] Lead event fires on email signup
- [ ] Verified with Pixel Helper extension
- [ ] Test event visible in Events Manager
- [ ] Domain verified in Meta Business Settings (Settings → Brand Safety → Domains)
- [ ] Aggregated Event Measurement configured (Events Manager → prioritize Lead event)
