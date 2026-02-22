# OurFable.ai — Landing Page Recommendations for Ad Traffic

## Key Principle

Most Meta ad traffic is **mobile** (85%+), **cold** (never heard of you), and **impatient** (3-second attention span). The page must communicate value and capture email within one scroll.

---

## Above the Fold (Critical)

### Must-Haves
- [ ] **Clear headline** communicating the core value prop: personalized + animated + storybook + your child
- [ ] **Email capture form** visible without scrolling on mobile
- [ ] **Visual proof** — show the animated storybook (a GIF or auto-playing video of Ken Burns effect is 10x better than a static screenshot)
- [ ] **One clear CTA** — "Join the Waitlist" or "Get Early Access" (not multiple competing actions)

### Avoid
- Navigation menus that distract from the CTA
- "Learn more" as primary action (people from ads won't scroll — capture them immediately)
- Hero images that are purely decorative and don't show the product

---

## Mobile Optimization Checklist

- [ ] Email input field is large enough to tap easily (min 48px height)
- [ ] CTA button is full-width on mobile (easy thumb target)
- [ ] No horizontal scroll
- [ ] Text is readable without zooming (16px+ body text)
- [ ] Images/videos load fast (see speed section)
- [ ] Form submission works without page reload (feels instant)
- [ ] No popups or modals on entry (Meta penalizes these, and they tank mobile UX)

---

## Load Speed

Meta Ads quality score factors in landing page experience. Slow pages = higher CPM + lower conversion.

**Targets:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Quick wins:**
- [ ] Optimize hero image/video (WebP, compressed, appropriately sized)
- [ ] Lazy-load below-fold content
- [ ] Minimize JS bundle (Next.js is good at this — make sure no heavy client-side libs loading above fold)
- [ ] Use `next/image` with proper sizing
- [ ] Check with [PageSpeed Insights](https://pagespeed.web.dev/)

---

## Content Flow (Recommended)

For cold ad traffic, this order works:

1. **Hero:** Headline + subhead + email capture + product visual (animated)
2. **Social proof / credibility:** Even "Join 500+ parents on the waitlist" once you have numbers
3. **How it works:** 3-step visual (upload photo → pick style → get animated book)
4. **Show the product:** Screenshot gallery or embedded video of an actual storybook
5. **Second CTA:** Repeat email capture
6. **FAQ** (optional): "Is it safe?" "How long does it take?" "What ages?"

---

## UTM Parameters

All ad traffic should use UTMs for Google Analytics tracking:

```
https://ourfable.ai?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

Use Meta's dynamic URL parameters (the `{{}}` syntax) in the ad URL field so each ad auto-tags.

**Also add to GA4:**
- Create a custom report filtering by `utm_source=meta` and `utm_medium=paid`
- Track: sessions, signup rate, bounce rate by `utm_content` (to see which ad creative converts best on-page)

---

## Conversion-Specific Recommendations

- [ ] **Thank-you state after signup:** Don't redirect to a new page. Show inline confirmation ("You're on the list! 🎉") — reduces bounce and feels smoother. Also: this is where the Lead pixel event should fire.
- [ ] **Set expectations:** After signup, tell them what happens next ("We'll email you when OurFable launches")
- [ ] **Consider a share hook:** "Share with a friend" after signup (organic amplification)
- [ ] **No pricing on the landing page** for waitlist phase — you're validating interest, not selling yet. Pricing can come in follow-up emails.

---

## Dedicated Ad Landing Variant (Optional but Recommended)

Consider creating `/welcome` or using a query param (`?ref=meta`) to show a slightly different version for ad traffic:

- Remove navigation (reduce exit paths)
- Headline matches the ad copy (message match increases conversion 20-30%)
- Even simpler layout — just hero + email capture + 3-step explainer

This can be a simple conditional in the existing page component rather than a whole new page.
