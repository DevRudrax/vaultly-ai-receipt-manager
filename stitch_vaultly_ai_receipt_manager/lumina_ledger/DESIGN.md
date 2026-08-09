---
name: Lumina Ledger
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#464555'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#474750'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f5f68'
  on-tertiary-container: '#dbdae4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e1ec'
  tertiary-fixed-dim: '#c6c5cf'
  on-tertiary-fixed: '#1a1b22'
  on-tertiary-fixed-variant: '#46464e'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is rooted in **Quiet Intelligence**. It moves away from the cluttered, data-heavy aesthetics of traditional fintech and adopts a high-end, editorial approach to personal document management. The personality is organized, protective, and effortless.

The design style is **High-End Minimalism** with a focus on tactile clarity. It leverages generous white space to reduce cognitive load while utilizing subtle depth to suggest the physical nature of receipts and cards. The "AI-first" experience is conveyed through precision—clean alignments, perfect typography, and a lack of decorative noise. The interface should feel like a premium concierge service: silent until needed, then exceptionally clear and helpful.

## Colors

The palette is built on a foundation of "Warm Sophistication." 

- **Background (#FAF9F6):** A warm off-white that feels more premium and less clinical than pure white. It serves as the canvas for all interactions.
- **Deep Charcoal (#1A1A1A):** Used for primary typography and iconography to ensure maximum legibility and a grounded, authoritative feel.
- **Deep Indigo (#4F46E5):** Reserved for primary actions, success states, and AI-driven insights. It is a high-contrast accent that feels modern and trustworthy.
- **Pure White (#FFFFFF):** Used exclusively for elevated surface cards to create a subtle "layering" effect against the warm background.
- **Neutral Accents:** Soft grays are used for secondary text and borders to maintain a low-friction visual hierarchy.

## Typography

This design system utilizes **Hanken Grotesk** for headlines and labels to provide a contemporary, sharp edge that feels engineered yet accessible. **Inter** is used for body copy due to its exceptional legibility at small sizes, particularly for receipt data and fine print.

Hierarchy is strictly enforced:
- **Displays:** Use sparingly for empty states or dashboard greetings.
- **Headlines:** Always in Deep Charcoal. Weight is used to differentiate importance rather than just size.
- **Labels:** Small caps are used for metadata (e.g., "PURCHASE DATE", "WARRANTY EXPIRY") to create an organized, architectural feel.

## Layout & Spacing

The layout philosophy follows a **Modular Fixed Grid**. Content is housed in clear, defined containers that maintain consistent margins. 

- **Mobile:** A single-column layout with 20px side margins. Elements are stacked with 16px vertical spacing.
- **Desktop:** A maximum content width of 1200px. AI insights are typically positioned in a narrower side-rail (4 columns) while the receipt vault occupies the primary area (8 columns).
- **Rhythm:** All spacing must be a multiple of 8px. Use 24px (stack-md) for separating logical sections and 48px (stack-lg) for major category shifts.

## Elevation & Depth

To achieve the "Apple Wallet" high-end feel, this design system avoids heavy shadows. It uses **Tonal Layering** and **Micro-Shadows**.

- **Level 0 (Background):** The #FAF9F6 surface. All global navigation and secondary elements sit here.
- **Level 1 (Cards):** Pure #FFFFFF surfaces with a 1px solid border (#E5E5E1). These represent receipts, warranty cards, or individual receipt entries.
- **Level 2 (Active/Hover):** A very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.04)) is applied only when an element is interactive or being "held" (dragged).

The goal is to make the digital objects feel like high-quality paper or plastic cards resting on a desk.

## Shapes

The shape language is defined by **Precision Softness**. A base radius of 16px (rounded-lg) is used for all primary cards and containers to evoke a friendly, modern consumer feel.

- **Primary Buttons:** Use a 12px radius to feel distinct from the larger containers they sit within.
- **Inputs:** 12px radius to match buttons.
- **Chips/Badges:** Fully pill-shaped to denote status (e.g., "Valid", "Expired").
- **Icons:** Set within 40px or 48px soft-rounded squares with a 10px radius for a consistent, "app-icon" look within the UI.

## Components

- **Receipt Cards:** The hero component. Pure white background, 16px corner radius, 1px subtle border. Contains a logo (left), merchant name (top), and price (right/bold).
- **Primary Action Button:** Deep Indigo (#4F46E5) background with white text. High contrast is mandatory. 
- **AI Insight Chips:** Subtle indigo tint background (#EEF2FF) with Deep Indigo text. Used for "Smart Tags" identified by the AI.
- **Status Indicators:** Use semantic colors with high desaturation. "Expired" uses a soft red tint; "Active" uses a soft emerald tint. Never use pure vibrant red/green.
- **Search & Input:** Clean, white fields with a 1px border. On focus, the border transitions to Deep Indigo with a 2px width.
- **The "Vault" View:** A vertical list of cards with 12px spacing between them, creating a physical "stack" appearance.
- **Empty States:** Center-aligned, using "Display" typography and a simple line-art illustration in Deep Charcoal.