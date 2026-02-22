# OurFable.ai — 2-Week Ad Test Timeline

## Pre-Launch (Before Day 1)

- [ ] Meta Pixel installed and verified (see pixel-setup.md)
- [ ] Landing page reviewed and optimized (see landing-page-recommendations.md)
- [ ] Ad creatives designed (minimum 3, ideally 5)
- [ ] Meta Business account set up, payment method added
- [ ] Custom Conversions configured (Lead event = email signup)
- [ ] Domain verified in Meta Business Settings
- [ ] UTM parameters set up in ad URLs
- [ ] Google Analytics filtering ready for `utm_source=meta`

---

## Week 1: Launch & Learn

### Day 1 (Monday)
- **Launch all 3 ad sets** with 2–3 creatives each
- Verify pixel events firing in Events Manager → Test Events
- Confirm ads are approved and delivering
- **Do not touch anything else.** Let it run.

### Day 2
- Quick check: are all ad sets spending? If one has $0 spend, check for disapproved ads or audience overlap issues.
- **Do not optimize.** Too early.

### Day 3
- First real check:
  - Are impressions delivering across all ad sets?
  - Any ads disapproved? Fix and resubmit.
  - Check landing page bounce rate in GA (if >80% from Meta traffic, page needs work)
- **Still do not kill anything.** Meta's algorithm needs 3–5 days to exit learning phase.

### Day 5 (Friday)
- **First optimization checkpoint.**
- Review:
  - CTR by ad creative (kill anything below 0.5% with 1,000+ impressions)
  - CPA by ad set (note which audience is cheapest)
  - Landing page conversion rate by UTM content
- Actions:
  - Pause worst-performing creative(s)
  - If one ad set has 2x+ CPA of others with 10+ conversions, consider pausing
  - If total signups < 5, check: is the pixel firing? Is the page converting? (Problem may not be the ads)

### Day 7 (Sunday)
- **Week 1 review.**
- Compile: total spend, total signups, CPA, CTR, CPM by ad set and creative
- Decide Week 2 strategy (see decision framework below)

---

## Week 2: Optimize & Decide

### Day 8 (Monday)
- Implement Week 2 changes:
  - Reallocate budget to best-performing ad set (up to 50% of total)
  - Launch 1–2 new creative variations of the winning ad (change headline OR image, not both)
  - If you have 50+ emails, upload to Meta and create 1% Lookalike audience → new ad set with $5/day

### Day 10 (Wednesday)
- Mid-week check:
  - Is the new creative outperforming? Give it 48h before judging.
  - Lookalike audience performing? (May be too small to judge yet)
  - Frequency check: if any ad set is above 2.5, audience is getting fatigued

### Day 12 (Friday)
- **Second optimization checkpoint.**
  - Kill any remaining underperformers
  - Note best-performing: audience × creative × placement combination
  - Check: are we on track for target CPA?

### Day 14 (Sunday)
- **Campaign ends. Final analysis.**
- Pause all ads.
- Compile final report (see below).

---

## Decision Framework

### After Week 1 (Day 7)

| Signups | CPA | CTR | Verdict |
|---|---|---|---|
| 20+ | < $5 | > 1.0% | 🟢 Strong signal. Optimize and continue Week 2 |
| 10–20 | $5–8 | 0.7–1.0% | 🟡 Promising. Optimize creative, tighten audience |
| < 10 | > $8 | < 0.7% | 🔴 Weak. Diagnose: is it the ad, the page, or the offer? |

**If 🔴 after Week 1:**
1. Check landing page conversion rate. If < 10% of clickers sign up → page problem, not ad problem
2. Check CTR. If CTR is good but CPA is high → page is leaking
3. Check creative engagement. If no one clicks → creative or targeting problem
4. Consider: is the value prop clear? Do people understand "animated storybook"?

### After Week 2 (Day 14) — Final Decision

| Total Signups | Avg CPA | Action |
|---|---|---|
| 80+ | < $3 | 🟢 **GO.** Strong demand signal. Scale budget to $50/day. Build the product. |
| 40–80 | $3–5 | 🟢 **GO with caution.** Demand exists but optimize before scaling. Consider improving landing page or creative before spending more. |
| 20–40 | $5–7 | 🟡 **PIVOT.** Interest exists but unit economics are weak. Test new creative angles, different audiences, or reposition the offer before spending more. |
| < 20 | > $7 | 🔴 **STOP.** Either the targeting is wrong, the page doesn't convert, or the market doesn't want this enough at this price point. Regroup. |

---

## Final Report Template (Day 14)

```
## OurFable Meta Ads — 2-Week Test Results

**Period:** [dates]
**Total Spend:** $___
**Total Signups:** ___
**Average CPA:** $___

### By Ad Set
| Ad Set | Spend | Signups | CPA | CTR | CPM |
|---|---|---|---|---|---|

### By Creative
| Creative | Spend | Signups | CPA | CTR |
|---|---|---|---|---|

### Best Performer
- Audience: ___
- Creative: ___
- CPA: $___

### Landing Page
- Click-to-signup rate: ___%
- Bounce rate: ___%

### Decision: GO / PIVOT / STOP
Rationale: ___

### Next Steps
1. ___
2. ___
3. ___
```
