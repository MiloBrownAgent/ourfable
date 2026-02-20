# OurFable.ai — Meta Ads Campaign Strategy

## Campaign Objective

**Demand validation via waitlist signups.** We're spending $300–500 over 2 weeks to answer one question: do parents care enough about animated personalized storybooks to give us their email?

**Campaign type:** Conversions (optimize for Lead event on email signup)
**Fallback:** If pixel data is thin in first 48h, switch to Landing Page Views optimization temporarily, then back to Conversions once we have 15–20 Lead events.

---

## Audience Targeting

### Ad Set 1: Parents (Core) — 40% of budget

**Demographics:**
- Age: 25–45
- Parents with children ages: 3–5, 6–8 (Meta demographic targeting)
- OR: Parents (All) with detailed targeting expansion enabled

**Interests (layer ANY of these):**
- Children's books
- Personalized gifts
- Kids activities
- Parenting magazine / Parenting.com
- PBS Kids
- Nick Jr.
- Cocomelon
- Reading Rainbow

**Behaviors:**
- Parents with preschoolers (3–5 years)
- Parents with early school-age children (6–8 years)
- Engaged shoppers

### Ad Set 2: Grandparents & Gift Buyers — 30% of budget

**Demographics:**
- Age: 50–70
- No parental status filter (grandparent status not directly targetable)

**Interests (layer ANY):**
- Grandparenting / Grandparents magazine
- Personalized gifts
- Children's books
- Gift giving
- Birthday gifts for kids
- Shutterfly / Artifact Uprising (photo-gift buyers)

**Behaviors:**
- Engaged shoppers
- Online shopping

### Ad Set 3: Digital-Savvy Parents (Interest Stack) — 30% of budget

**Demographics:**
- Age: 25–40
- Parents (All)

**Interests (layer ANY):**
- Educational toys
- STEM toys
- Montessori
- Kindle Kids
- Audible
- Storybook apps
- ABCmouse
- Homer (learning app)
- Epic! (kids' reading)

**Behaviors:**
- Technology early adopters
- Engaged shoppers

### Lookalike Audiences (Phase 2)

Once waitlist hits 100+ emails, create:
- 1% Lookalike from waitlist emails (Custom Audience → upload)
- 1% Lookalike from landing page visitors (pixel-based)

Reallocate budget from worst-performing ad set to lookalike.

---

## Geographic Targeting

**US-wide.** No geo restriction for validation phase.

**Exclude:** Alaska, Hawaii (shipping-irrelevant but also just noise for a digital product — actually, keep them. Digital product = no shipping. US-wide is fine.)

**Language:** English (All)

---

## Budget Allocation ($400 total / 14 days)

| Ad Set | Daily Budget | 14-Day Total |
|---|---|---|
| Parents (Core) | $11.50/day | $161 |
| Grandparents & Gift | $8.50/day | $119 |
| Digital-Savvy Parents | $8.50/day | $119 |
| **Total** | **$28.50/day** | **$400** |

**Bidding:** Lowest cost (let Meta optimize). No bid caps during validation.

**Campaign Budget Optimization (CBO):** OFF for first 5 days so each ad set gets fair spend. Switch to CBO after Day 5 if one ad set clearly dominates.

---

## A/B Testing Plan

### Week 1: Creative Test
- Each ad set gets 2–3 ad creatives (see ad-creative.md)
- Test: emotional parent hook vs. product demo vs. gift angle
- Let each creative get at least 500 impressions before judging

### Week 2: Optimize Winners
- Kill creatives with CTR < 0.8% after 1,000+ impressions
- Double down on best performer
- Test 1 new variation of the winning creative (headline swap or image swap)

### What We're Testing:
1. **Audience:** Which ad set converts cheapest?
2. **Creative hook:** Emotional vs. practical vs. gift-giving
3. **Format:** Static image vs. short video/GIF (if assets available)

---

## KPIs & Success Criteria

### Benchmarks (Parenting / Kids Niche on Meta)

| Metric | Benchmark | Our Target |
|---|---|---|
| CPM | $8–15 | < $15 |
| CPC (link click) | $0.80–2.00 | < $1.50 |
| CTR (link) | 0.8%–1.5% | > 1.0% |
| Landing page → signup rate | 15–30% | > 20% |
| CPA (email signup) | — | < $5.00 |

### What "Success" Looks Like

- **🟢 GO:** CPA under $3.00, CTR > 1.2%, 80+ signups → Scale to $50/day
- **🟡 PIVOT:** CPA $3–7, CTR 0.8–1.2%, 40–80 signups → Optimize creative/audience, test new angles
- **🔴 STOP:** CPA > $7, CTR < 0.6%, < 40 signups → Reassess product-market fit or targeting

### Secondary Metrics to Watch
- Thumb-stop rate (3-second video views / impressions) if using video
- Frequency (keep under 3.0 over 2 weeks)
- Landing page bounce rate (via Google Analytics)

---

## Funnel

```
Meta Ad (FB Feed / IG Feed / IG Stories)
    ↓
ourfable.ai landing page (with UTM params)
    ↓
Email signup (waitlist CTA)
    ↓
Pixel fires "Lead" event
    ↓
Thank-you state / confirmation
```

**UTM Structure:** `?utm_source=meta&utm_medium=paid&utm_campaign={campaign_name}&utm_content={ad_name}&utm_term={adset_name}`

---

## Campaign Settings Checklist

- [ ] Placements: Advantage+ (let Meta optimize) — but review after 3 days and exclude Audience Network if it's eating budget with no conversions
- [ ] Ad scheduling: All day (not enough budget to time-optimize)
- [ ] Attribution window: 7-day click, 1-day view
- [ ] Dynamic creative: OFF (we want to control which creative wins)
- [ ] Conversion location: Website
- [ ] Conversion event: Lead
- [ ] Pixel: Must be installed and firing before launching (see pixel-setup.md)
