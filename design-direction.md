# OurFable.ai — Design Direction

## Research Findings

Analyzed: Wonderbly (11M+ books sold, acquired by Penguin Random House), Hooray Heroes (3M+ personalizations), PBS Kids, CoComelon/Moonbug, plus 30+ children's web design examples.

### What the winners have in common

**1. The site targets PARENTS, not children.**
Wonderbly and Hooray Heroes both look premium and clean — not like a kid's playroom. The product (the book itself) is colorful. The website is warm but sophisticated. Parents are spending $30-40. The site needs to feel worth it.

**2. White/cream backgrounds — not colored.**
Every successful personalized book site uses white or near-white backgrounds. Your current yellow (#FFF9EE) reads as cheap and dated. Wonderbly uses pure white. Hooray Heroes uses white with warm photography.

**3. One strong brand color, not a rainbow.**
Wonderbly owns green. Hooray Heroes owns coral/red. PBS Kids owns green. None of them use 6+ colors competing for attention. One dominant brand color + one CTA accent color + neutrals.

**4. Rounded, warm typography that's NOT childish.**
Rounded sans-serifs (like your Baloo 2 + Nunito) are correct. But they're used sparingly — headlines only for the display font, clean body font for everything else. No Comic Sans energy.

**5. Product imagery does the heavy lifting.**
The book mockups, illustrations, and photos of kids reading are what make it feel magical — not background gradients or floating shapes. Let the AI-generated illustrations sell the product.

**6. Trust signals are prominent.**
Trustpilot ratings, "3M+ books sold", "shipped in 3 days", review quotes — all above the fold or very near it. Parents need reassurance before buying.

**7. Simple, clear user journey.**
One primary CTA. Not two buttons competing. "Create your book" or "Personalize" — singular, clear action.

---

## New Design System for OurFable.ai

### Color Palette

```
--teal:          #0EA5A5    (Primary brand — warm, trustworthy, distinct from competitors)
--teal-dark:     #0C8C8C    (Hover states)
--teal-light:    #E6F7F7    (Light backgrounds, badges)

--coral:         #FF6B5A    (CTA accent — warm, energetic, high contrast)
--coral-dark:    #E85A4A    (Hover states)
--coral-light:   #FFF0EE    (Light backgrounds)

--ink:           #1A1A2E    (Primary text — warm dark, not pure black)
--ink-light:     #4A4A5E    (Secondary text)
--ink-muted:     #8888A0    (Tertiary text, captions)

--bg:            #FFFFFF    (Primary background — clean white)
--bg-warm:       #FAFAF8    (Section alternation — barely warm)
--bg-card:       #FFFFFF    (Cards)

--border:        #E8E8EE    (Borders, dividers)
--border-light:  #F2F2F6    (Subtle borders)

--gold:          #F5A623    (Stars, ratings, small accents)
```

### Typography
- **Display:** Baloo 2 (keep — it's warm, round, distinctive)
- **Body:** Nunito (keep — clean, readable, pairs well)
- Remove Caveat (handwriting fonts look amateur at this level)

### Design Principles
1. **Clean over cluttered** — white space is premium
2. **Warm over cold** — teal + coral feel inviting, not corporate
3. **Show don't decorate** — book mockups and illustrations, not floating shapes
4. **One CTA per section** — don't split attention
5. **Trust immediately** — social proof near the top
