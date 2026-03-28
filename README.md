# ☕ Coffee Brand — Complete Design Guide

> A comprehensive reference document for building a coffee brand's
> identity, digital presence, and design system from scratch.
> Written for designers, developers, and brand managers.

---

## 📋 Table of Contents

1. [Brand Overview](#1-brand-overview)
2. [Brand Identity & Philosophy](#2-brand-identity--philosophy)
3. [Logo & Brand Mark](#3-logo--brand-mark)
4. [Color System](#4-color-system)
5. [Typography](#5-typography)
6. [Illustration & Imagery](#6-illustration--imagery)
7. [Layout & Spacing Principles](#7-layout--spacing-principles)
8. [Seasonal Design System](#8-seasonal-design-system)
9. [Digital UI Recreation Guide](#9-digital-ui-recreation-guide)
10. [File & Folder Structure](#10-file--folder-structure)
11. [Code Style Guide](#11-code-style-guide)
12. [Component Library](#12-component-library)
13. [Accessibility Standards](#13-accessibility-standards)
14. [Brand Voice & Tone](#14-brand-voice--tone)
15. [Quick-Start Checklist](#15-quick-start-checklist)

---

## 1. Brand Overview

| Property        | Value                          |
|-----------------|-------------------------------|
| Brand Direction | Midnight & Plum                |
| Positioning     | Moody · Premium · Late-night espresso bar |
| Mission         | To create a space where the night feels at home — one cup, one moment, one guest at a time |
| Brand Essence   | Depth, intimacy, craftsmanship, atmosphere |

---

## 2. Brand Identity & Philosophy

The brand is built on **two complementary pillars**:

### Pillar 1 — Clarity & Function
> Make information legible. Help customers order, navigate, and engage without friction.

### Pillar 2 — Expressivity & Emotion
> Create depth, mood, and seasonal intrigue through art, color, and illustration.

The design system lets creators "dial up" either trait depending on the context — a menu board leans functional; a seasonal campaign leans expressive.

### Core Brand Values
- **Connection** — People over product
- **Craftsmanship** — Coffee as an art form
- **Community** — Every store as a neighbourhood gathering place
- **Sustainability** — Ethical sourcing and environmental stewardship
- **Inclusivity** — Belonging for everyone

---

## 3. Logo & Brand Mark

### 3.1 The Brand Mark

The brand mark is the most recognisable asset — a bold, minimal icon that evokes both the night and the ritual of coffee.

**Key attributes:**
- Always centered, symmetrical, and balanced
- Never stretched, rotated, recolored outside guidelines, or obscured
- Preferred use: brand mark appears **alone**, unlocked from the wordmark
- This gives the mark greater prominence in modern layouts

### 3.2 Logo Variations

| Variation              | When to Use                                              |
|------------------------|----------------------------------------------------------|
| Full-Color (Plum)      | Background lightness between 0–60% on grayscale         |
| Full-Color Reverse     | Background lightness between 80–100% (dark backgrounds) |
| One-Color Black        | Single-color printing; backgrounds 0–80% grayscale      |
| One-Color White        | Dark backgrounds where plum lacks contrast              |

### 3.3 Logo Clear Space

Always maintain a minimum clear space around the logo equal to **the height of the mark's top edge**.

```
  ┌──────────────────────────┐
  │   [Mark-height margin]    │
  │  ┌────────────────────┐  │
  │  │                    │  │
  │  │   BRAND MARK HERE  │  │
  │  │                    │  │
  │  └────────────────────┘  │
  │   [Mark-height margin]    │
  └──────────────────────────┘
```

### 3.4 Logo Don'ts

- ❌ Do not recolor the mark outside the approved palette
- ❌ Do not crop, clip, or mask the mark
- ❌ Do not apply drop shadows or 3D effects
- ❌ Do not place the mark on a plum background (insufficient contrast)
- ❌ Do not distort or skew proportions
- ❌ Do not combine the mark with unauthorised wordmarks

---

## 4. Color System

### 4.1 Primary Brand Colors

```css
/* ─────────────────────────────────────────────
   PRIMARY PALETTE — MIDNIGHT & PLUM
   These are the foundation of all design.
   ───────────────────────────────────────────── */

--color-midnight:   #1A1820;  /* Deep near-black — primary dark    */
--color-plum:       #6A3AB0;  /* Core brand purple — primary CTA   */
--color-ghost-white:#F8F5FC;  /* Off-white — primary light surface */
```

### 4.2 Extended Plum Family

The brand uses an **expanded family of purples** rooted in the midnight plum palette. At least one brand purple must always appear — either in the composition or through the brand mark.

```css
/* ─────────────────────────────────────────────
   EXTENDED PLUM PALETTE
   Use these to add depth; always pair with
   the primary Plum as an anchor.
   ───────────────────────────────────────────── */

--color-midnight:     #1A1820;  /* Deepest dark — backgrounds, headers   */
--color-plum:         #6A3AB0;  /* Core brand plum — primary CTA         */
--color-lavender:     #A07AD0;  /* Mid-tone — hover states, accents      */
--color-lilac-mist:   #EDE0FF;  /* Muted tint — hover states, cards      */
--color-ghost-white:  #F8F5FC;  /* Lightest surface — page backgrounds   */
```

### 4.3 Neutral Palette

```css
/* ─────────────────────────────────────────────
   NEUTRALS
   Support readability and layout breathing room.
   ───────────────────────────────────────────── */

--color-ghost-white:  #F8F5FC;  /* Off-white — page backgrounds         */
--color-lilac-mist:   #EDE0FF;  /* Light surface — card surfaces        */
--color-gray-light:   #DDD0EA;  /* Dividers, input borders              */
--color-gray-mid:     #8A6AAA;  /* Secondary text (meets AA contrast)   */
--color-gray-dark:    #1A1820;  /* Body text (midnight)                 */
```

### 4.4 Seasonal Accent Colors

These shift each season. Always ensure a brand purple remains present in the composition.

| Season | Accent Colors (approximate) |
|--------|-----------------------------|
| Spring | Dusty rose `#D4829A`, Sage `#8FAF8D`, Lilac `#C4A0D8` |
| Summer | Violet `#7C5CBF`, Soft teal `#5DCAA5`, Pale lavender `#D8C8F0` |
| Fall   | Deep plum `#4A1A8A`, Slate `#6A6080`, Mauve `#A07090` |
| Winter | Midnight `#1A1820`, Amethyst `#8B5AC8`, Ghost white `#F8F5FC` |

---

## 5. Typography

### 5.1 The Type System

The brand uses **three purpose-built typefaces**. Each serves a defined role — do not mix roles without reason.

```
┌─────────────────────────────────────────────────────────────┐
│  TYPEFACE       │  ROLE             │  USE CASES            │
│─────────────────┼───────────────────┼───────────────────── │
│  Body Sans      │  Workhorse        │  Body copy, UI text,  │
│                 │  (most versatile) │  navigation, labels   │
│─────────────────┼───────────────────┼───────────────────── │
│  Display Serif  │  Expressive serif │  Accent text, social  │
│                 │  (use sparingly)  │  media, pull quotes   │
│─────────────────┼───────────────────┼───────────────────── │
│  Condensed      │  Impactful        │  Headlines, wayfinding│
│                 │  condensed        │  large-format signage │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Web Font Recommendations

```css
/* ─────────────────────────────────────────────
   FONT STACK
   Recommended publicly available alternatives.
   ───────────────────────────────────────────── */

--font-body:     'DM Sans', 'Source Sans 3', 'Helvetica Neue', sans-serif;
--font-serif:    'Playfair Display', 'Lora', Georgia, serif;
--font-display:  'Barlow Condensed', 'Trade Gothic LT Condensed', 'Arial Narrow', sans-serif;
```

### 5.3 Type Scale

```css
/* ─────────────────────────────────────────────
   TYPOGRAPHIC SCALE
   Based on a 1.25 modular scale (Major Third).
   All sizes in rem (root = 16px).
   ───────────────────────────────────────────── */

--text-xs:    0.64rem;    /*  ~10px — legal, captions          */
--text-sm:    0.8rem;     /*  ~13px — metadata, labels         */
--text-base:  1rem;       /*   16px — body copy                */
--text-md:    1.25rem;    /*   20px — lead text                */
--text-lg:    1.563rem;   /*  ~25px — sub-headings             */
--text-xl:    1.953rem;   /*  ~31px — section headers          */
--text-2xl:   2.441rem;   /*  ~39px — page headings            */
--text-3xl:   3.052rem;   /*  ~49px — hero display             */
--text-4xl:   3.815rem;   /*  ~61px — large format / signage   */
```

### 5.4 Line Height & Spacing

```css
--leading-tight:   1.2;   /* Headlines and display type  */
--leading-normal:  1.5;   /* Body copy default           */
--leading-relaxed: 1.75;  /* Long-form reading content   */

--tracking-tight:  -0.02em;   /* Large display headlines    */
--tracking-normal:  0;        /* Body and UI text           */
--tracking-wide:    0.08em;   /* All-caps labels and badges */
```

---

## 6. Illustration & Imagery

### 6.1 Illustration Style

Brand illustrations are:
- **Hand-crafted in feel** — even when digital, they appear artisanal
- **Rooted in coffee culture** — beans, botanicals, cups, steam, seasonal ingredients
- **Brand-anchored** — always in the midnight & plum color palette
- **Evolving with trend** — each season brings fresh motifs

### 6.2 Photography Guidelines

| Category            | Style Direction                                    |
|---------------------|----------------------------------------------------|
| Product             | Dark, dramatic lit against midnight or plum backgrounds |
| People              | Real, candid, warm — diverse and inclusive         |
| Stores / Interiors  | Low-light, moody, intimate atmosphere              |
| Coffee Craft        | Macro details — pour, steam, texture               |
| Nature / Sourcing   | Authentic farm and harvest imagery                 |

**Photography tone:** Moody, intimate, genuine. Never overly staged.

### 6.3 Iconography

- Icons should be **simple, rounded, and line-based** at small sizes
- At medium+ sizes, icons can carry more weight and personality
- Always use brand colors — never introduce new colors via icons alone

---

## 7. Layout & Spacing Principles

### 7.1 Spacing Scale

```css
/* ─────────────────────────────────────────────
   SPACING SCALE
   Base unit: 8px. All spacing is a multiple.
   ───────────────────────────────────────────── */

--space-1:   4px;    /* Micro gaps              */
--space-2:   8px;    /* Default baseline unit   */
--space-3:  12px;    /* Tight component spacing */
--space-4:  16px;    /* Standard component gap  */
--space-6:  24px;    /* Section inner padding   */
--space-8:  32px;    /* Card / block padding    */
--space-12: 48px;    /* Section margins         */
--space-16: 64px;    /* Page-level sections     */
--space-24: 96px;    /* Hero / large sections   */
--space-32: 128px;   /* Major page divisions    */
```

### 7.2 Grid System

```
Standard Grid:     12 columns
Column Gutter:     24px (desktop), 16px (tablet), 12px (mobile)
Page Max-Width:    1440px
Content Max-Width: 1200px
Side Margins:      80px (desktop), 40px (tablet), 24px (mobile)
```

### 7.3 Border Radius

```css
--radius-sm:   4px;    /* Badges, tags, small elements  */
--radius-md:   8px;    /* Buttons, inputs               */
--radius-lg:  16px;    /* Cards                         */
--radius-xl:  24px;    /* Feature cards, modals         */
--radius-full: 9999px; /* Pills, circular elements      */
```

---

## 8. Seasonal Design System

Every quarter, the accent palette and illustration motifs rotate. The constants are:

✅ Brand purples always present  
✅ Brand mark always present  
✅ Body Sans for all functional copy  
✅ Moody, intimate photography tone  

Only these change seasonally:
- Accent colors (3–4 per season)
- Illustration motifs (botanicals, ingredients, nature)
- Background tones (deep to pale per season)

---

## 9. Digital UI Recreation Guide

### 9.1 Breakpoints

```css
/* ─────────────────────────────────────────────
   RESPONSIVE BREAKPOINTS
   Mobile-first approach. Styles apply upward.
   ───────────────────────────────────────────── */

--bp-sm:  480px;    /* Large phones           */
--bp-md:  768px;    /* Tablets                */
--bp-lg:  1024px;   /* Small laptops          */
--bp-xl:  1280px;   /* Standard desktops      */
--bp-2xl: 1440px;   /* Large / wide screens   */
```

### 9.2 Core Component Tokens

```css
/* ─────────────────────────────────────────────
   COMPONENT DESIGN TOKENS
   Reference these in all component styles.
   ───────────────────────────────────────────── */

/* Buttons */
--btn-primary-bg:       var(--color-plum);
--btn-primary-text:     var(--color-ghost-white);
--btn-primary-hover:    #4a1a8a;
--btn-secondary-bg:     transparent;
--btn-secondary-border: var(--color-plum);
--btn-secondary-text:   var(--color-plum);
--btn-height:           48px;
--btn-padding:          0 24px;
--btn-radius:           var(--radius-full);
--btn-font:             var(--font-body);
--btn-weight:           600;
--btn-tracking:         var(--tracking-wide);

/* Navigation */
--nav-bg:               var(--color-midnight);
--nav-height:           72px;
--nav-text:             var(--color-lilac-mist);
--nav-text-hover:       var(--color-lavender);
--nav-border:           var(--color-gray-light);

/* Cards */
--card-bg:              var(--color-ghost-white);
--card-border:          var(--color-gray-light);
--card-radius:          var(--radius-lg);
--card-shadow:          0 2px 12px rgba(26, 24, 32, 0.08);
--card-shadow-hover:    0 8px 32px rgba(26, 24, 32, 0.16);

/* Inputs */
--input-bg:             var(--color-ghost-white);
--input-border:         var(--color-gray-light);
--input-border-focus:   var(--color-plum);
--input-radius:         var(--radius-md);
--input-height:         48px;
--input-padding:        0 16px;
```

### 9.3 Motion & Animation

```css
/* ─────────────────────────────────────────────
   MOTION TOKENS
   Keep animations purposeful and brief.
   ───────────────────────────────────────────── */

--ease-default:   cubic-bezier(0.25, 0.1, 0.25, 1.0);  /* Standard easing     */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);            /* Entrances           */
--ease-out:       cubic-bezier(0, 0, 0.2, 1);            /* Exits               */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);     /* Playful interactions*/

--duration-fast:    150ms;   /* Micro: hover, active states   */
--duration-normal:  250ms;   /* Standard transitions          */
--duration-slow:    400ms;   /* Page transitions, modals      */
--duration-xslow:  600ms;   /* Hero animations, page load    */
```

---

## 10. File & Folder Structure

Below is the recommended project structure for this web project:

```
coffee-brand/
│
├── README.md                       ← This file
│
├── public/                         ← Static assets (served as-is)
│   ├── favicon.ico
│   ├── logo-mark.svg
│   └── fonts/
│       ├── DMSans-Regular.woff2
│       ├── DMSans-Medium.woff2
│       ├── DMSans-Bold.woff2
│       ├── PlayfairDisplay-Regular.woff2
│       └── BarlowCondensed-Bold.woff2
│
├── src/
│   │
│   ├── styles/                     ← Global styles and tokens
│   │   ├── tokens.css              ← ALL design tokens (colors, spacing, type)
│   │   ├── reset.css               ← CSS reset / normalize
│   │   ├── typography.css          ← Font face declarations and base type styles
│   │   ├── layout.css              ← Grid, containers, breakpoints
│   │   └── main.css                ← Imports all style files
│   │
│   ├── components/                 ← Reusable UI components
│   │   ├── navigation/
│   │   │   ├── Navbar.jsx          ← Top navigation bar
│   │   │   └── Navbar.module.css
│   │   ├── button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   ├── card/
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProductCard.module.css
│   │   ├── hero/
│   │   │   ├── Hero.jsx
│   │   │   └── Hero.module.css
│   │   ├── menu/
│   │   │   ├── MenuGrid.jsx
│   │   │   └── MenuGrid.module.css
│   │   └── footer/
│   │       ├── Footer.jsx
│   │       └── Footer.module.css
│   │
│   ├── pages/                      ← Page-level components
│   │   ├── Home.jsx
│   │   ├── Menu.jsx
│   │   ├── Rewards.jsx
│   │   ├── StoreLocator.jsx
│   │   └── About.jsx
│   │
│   ├── assets/                     ← Images, icons, illustrations
│   │   ├── icons/
│   │   ├── illustrations/
│   │   └── photography/
│   │
│   └── utils/                      ← Helper functions
│       ├── breakpoints.js
│       └── helpers.js
│
├── package.json
└── .env                            ← API keys (never commit)
```

---

## 11. Code Style Guide

This section ensures code remains **readable, consistent, and easy for any human to edit**.

### 11.1 General Principles

> **The golden rule:** Write code for the next developer, not for the machine.

1. **Clarity over cleverness** — If a one-liner needs a comment to explain it, rewrite it.
2. **One thing per component** — Each file does exactly one job.
3. **Name things clearly** — `PrimaryButton` not `Btn1`. `--color-plum` not `--c1`.
4. **Comment the "why", not the "what"** — Code shows what. Comments explain intent.

### 11.2 CSS Conventions

```css
/* ─────────────────────────────────────────────
   SECTION HEADER FORMAT
   Use this format to separate major sections.
   Each section gets its own comment block.
   ───────────────────────────────────────────── */


/* Component: Primary Button
   ─────────────────────────
   Used for main CTA actions (Order Now, Sign In).
   Always uses brand plum as background. */

.btn-primary {

  /* Layout */
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  height:          var(--btn-height);
  padding:         var(--btn-padding);

  /* Visual */
  background-color: var(--btn-primary-bg);
  border:           none;
  border-radius:    var(--btn-radius);

  /* Typography */
  font-family:      var(--font-body);
  font-size:        var(--text-base);
  font-weight:      600;
  letter-spacing:   var(--tracking-wide);
  color:            var(--btn-primary-text);
  text-transform:   uppercase;
  text-decoration:  none;

  /* Interaction */
  cursor:           pointer;
  transition:       background-color var(--duration-fast) var(--ease-default),
                    transform        var(--duration-fast) var(--ease-default);
}

/* Hover state — darken background slightly */
.btn-primary:hover {
  background-color: var(--btn-primary-hover);
  transform: translateY(-1px);   /* Subtle lift effect */
}

/* Active state — press down */
.btn-primary:active {
  transform: translateY(0);
}
```

**CSS ordering rule:** Always write properties in this order:
1. Position (`position`, `top`, `left`, `z-index`)
2. Layout (`display`, `flex`, `grid`, `width`, `height`)
3. Spacing (`margin`, `padding`)
4. Visual (`background`, `border`, `border-radius`, `box-shadow`)
5. Typography (`font-*`, `color`, `text-*`, `line-height`)
6. Interaction (`cursor`, `transition`, `transform`)

### 11.3 JavaScript / JSX Conventions

```jsx
// ─────────────────────────────────────────────
// ProductCard Component
//
// Displays a single menu item with name, price,
// image, and an "Add to Order" button.
//
// Props:
//   name     (string)  — Product name
//   price    (number)  — Price in local currency
//   imageUrl (string)  — URL to product image
//   calories (number)  — Optional calorie count
// ─────────────────────────────────────────────

import React from 'react';
import styles from './ProductCard.module.css';
import Button from '../button/Button';

// Formats a price number to a currency string
const formatPrice = (price) => `₦${price.toLocaleString()}`;

function ProductCard({ name, price, imageUrl, calories }) {

  // Show calorie info only if provided by the API
  const hasCalories = calories !== undefined && calories !== null;

  return (
    <article className={styles.card} aria-label={`${name}, ${formatPrice(price)}`}>

      {/* Product image — uses object-fit to maintain aspect ratio */}
      <div className={styles.imageWrapper}>
        <img
          src={imageUrl}
          alt={name}
          className={styles.image}
          loading="lazy"   /* Defer off-screen images for performance */
        />
      </div>

      {/* Card body content */}
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>

        {/* Render calories only when data is available */}
        {hasCalories && (
          <p className={styles.calories}>{calories} Cal</p>
        )}

        <p className={styles.price}>{formatPrice(price)}</p>
      </div>

      {/* CTA — triggers add-to-cart flow */}
      <Button variant="secondary" size="sm">
        Add to Order
      </Button>

    </article>
  );
}

export default ProductCard;
```

### 11.4 Naming Conventions

| Type             | Convention          | Example                      |
|------------------|---------------------|------------------------------|
| CSS Variables    | `--kebab-case`      | `--color-plum`               |
| CSS Classes      | `camelCase`         | `.productCard`, `.navItem`   |
| React Components | `PascalCase`        | `ProductCard`, `HeroSection` |
| JS Functions     | `camelCase`         | `formatPrice()`, `getMenu()` |
| JS Constants     | `SCREAMING_SNAKE`   | `MAX_ITEMS`, `API_BASE_URL`  |
| Files            | Match component name| `ProductCard.jsx`            |
| Image files      | `kebab-case`        | `hero-summer-2024.jpg`       |

### 11.5 Comment Style Rules

```css
/* ── Use this for SECTION separators ─────────── */

/* Use this for component-level descriptions */

/* Use inline comments for single-line explanations */

/*
  Use this multi-line format for anything
  that requires a longer explanation of intent,
  edge cases, or business logic.
*/
```

---

## 12. Component Library

### 12.1 Button Variants

```
[Primary]     Filled plum — main CTAs
[Secondary]   Outlined plum — secondary actions
[Ghost]       Text-only — tertiary, low-emphasis
[Destructive] Outlined red — delete / cancel actions
[Light]       Ghost white fill on dark backgrounds
```

### 12.2 Navigation Structure

```
Top Nav:
  [Brand Mark] | [Menu] [Rewards] [Gift Cards] [Find a Store]
                                  [Sign In] [Order Now ▶]

Mobile Nav:
  [Hamburger ☰] | [Brand Mark] | [Cart 🛒]
  (Full-screen drawer on open)
```

### 12.3 Key Page Sections

| Page          | Key Sections                                        |
|---------------|-----------------------------------------------------|
| Home          | Hero banner, Featured drinks, Rewards CTA, Seasonal promo, App download |
| Menu          | Category filter, Product grid, Item customizer modal |
| Rewards       | Stars tracker, Tier benefits, Earn/redeem explainer  |
| Store Locator | Map view, Search input, Store list panel            |
| Product Detail| Image, Name, Calories, Customization, Nutrition info |

---

## 13. Accessibility Standards

All digital experiences target **WCAG 2.1 AA** compliance minimum.

### 13.1 Color Contrast Requirements

| Text Type             | Minimum Ratio | Plum (#6A3AB0) on Ghost White |
|-----------------------|---------------|-------------------------------|
| Normal text (<18px)   | 4.5 : 1       | ✅ passes AA                  |
| Large text (≥18px)    | 3.0 : 1       | ✅ passes                     |
| UI components         | 3.0 : 1       | ✅ passes                     |

> ⚠️ **Warning:** Do not use `#6A3AB0` text on plum backgrounds — contrast fails.
> Always use ghost white or midnight text on plum backgrounds.

### 13.2 Focus Styles

```css
/* ─────────────────────────────────────────────
   FOCUS STYLES
   Never remove :focus outlines. Instead, replace
   the default with a branded, visible focus ring.
   ───────────────────────────────────────────── */

:focus-visible {
  outline: 3px solid var(--color-plum);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

### 13.3 Semantic HTML Checklist

- [ ] Use `<nav>` for navigation
- [ ] Use `<main>` for primary content (one per page)
- [ ] Use `<article>` for product cards
- [ ] Use `<section>` with `aria-label` for named regions
- [ ] Use `<button>` not `<div>` for interactive elements
- [ ] All images have meaningful `alt` text
- [ ] Form inputs have `<label>` elements
- [ ] ARIA roles used only when HTML semantics are insufficient

---

## 14. Brand Voice & Tone

### 14.1 Core Voice Attributes

| Attribute     | What It Means                                           |
|---------------|---------------------------------------------------------|
| **Warm**      | Speak like a knowledgeable friend, never a corporation  |
| **Genuine**   | Honest, no marketing-speak or empty superlatives        |
| **Inclusive** | Every customer belongs; language is welcoming to all    |
| **Atmospheric**| Evocative, mood-setting, night-feels-alive              |
| **Crafted**   | Precise word choices that reflect coffee expertise      |

### 14.2 Writing Examples

| ❌ Don't Write             | ✅ Write Instead                          |
|----------------------------|-------------------------------------------|
| "Order now to receive..."  | "Your drink is a tap away."              |
| "Our premium beverages"    | "Drinks made the way you love them."     |
| "Utilize our mobile app"   | "Order ahead with our app."             |
| "All customers are valued" | "There's a place here for everyone."    |

### 14.3 Product Naming Conventions

- Capitalize full product names: **Signature Espresso**, **Midnight Cold Brew**
- Refer to sizes descriptively: **Small** (8oz), **Regular** (12oz), **Large** (16oz)
- Use evocative language that fits the moody brand personality

---

## 15. Quick-Start Checklist

Use this to verify a build is brand-compliant before launch:

### Colors
- [ ] Brand plum `#6A3AB0` is present in the design
- [ ] Midnight `#1A1820` used for dark backgrounds
- [ ] No unapproved colors introduced
- [ ] Text contrast meets WCAG AA on all backgrounds
- [ ] Seasonal accent colors align with current quarter

### Typography
- [ ] Body Sans (DM Sans or equivalent) used for body copy
- [ ] Display Serif used sparingly for expressive moments
- [ ] Condensed face used for impact headlines only
- [ ] No decorative fonts introduced outside the system

### Logo
- [ ] Brand mark maintains clear space
- [ ] Mark is not distorted, recolored, or obscured
- [ ] Correct logo variant used for background contrast level

### Code Quality
- [ ] All design tokens defined in `tokens.css`
- [ ] No magic numbers in CSS (use token variables)
- [ ] Components are single-responsibility
- [ ] All interactive elements keyboard-accessible
- [ ] Images have alt text
- [ ] No `!important` used (except in reset)

### Brand Voice
- [ ] Copy is warm, genuine, and atmospheric
- [ ] Product names are properly capitalised
- [ ] Tone feels intimate, not corporate

---

## 📚 References

- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [DM Sans on Google Fonts](https://fonts.google.com/specimen/DM+Sans)
- [Playfair Display on Google Fonts](https://fonts.google.com/specimen/Playfair+Display)
- [Barlow Condensed on Google Fonts](https://fonts.google.com/specimen/Barlow+Condensed)

---

*This document is a brand reference guide for design and development use.*
