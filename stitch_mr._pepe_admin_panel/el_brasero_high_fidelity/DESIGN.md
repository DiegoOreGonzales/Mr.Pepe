# Design System Strategy: The Hearth of Precision

## 1. Overview & Creative North Star
This design system is built to elevate the operational backend of a premium Peruvian rotisserie into a high-fidelity editorial experience. We are moving away from the "generic SaaS" aesthetic to embrace a Creative North Star we call **"The Ember Grid."**

The Ember Grid balances the raw, visceral heat of the traditional charcoal oven (*El Brasero*) with the surgical, cold precision of modern administrative tools like Linear or Vercel. We achieve this through:
*   **Intentional Asymmetry:** Breaking the rigid 12-column grid with oversized headlines and offset data visualizations.
*   **Tonal Depth:** Replacing harsh lines with overlapping surfaces that mimic layers of smoke and heat.
*   **High-Contrast Editorial Typography:** Treating every table and metric like a spread in a premium culinary magazine.

---

## 2. Colors: The 'El Brasero' Palette
The palette is rooted in the deep blacks of charcoal and the vibrant, kinetic energy of a live flame.

### Primary Roles
*   **Primary (`#BF391B`):** The core flame. Reserved for high-intent actions and active states.
*   **Primary Dark (`#8C2510`):** The glowing ember. Used for hover states and sophisticated sidebar accents.
*   **Primary Light (`#E54D2A`):** The spark. Used for highlights and subtle attention-grabbing badges.

### Surface Hierarchy & The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off the UI. Boundaries must be defined through background color shifts or the "Ghost Border" fallback.
*   **Scaffold Background (`#F0F2F5`):** The base canvas.
*   **Surface Lowest (`#FFFFFF`):** High-priority content cards and modals.
*   **Surface Low (`#F8F9FA`):** Input fields and secondary containers.
*   **Surface Dark (`#1A1A1A`):** The Sidebar, creating a heavy, authoritative anchor on the left.

### The "Glass & Gradient" Rule
To inject "soul" into the dashboard, use the **Ember Gradient** (`#8C2510` to `#BF391B` to `#E54D2A`) for the sidebar header and primary hero metrics. Floating elements (like global search) should utilize a backdrop-blur (12px) with a semi-transparent white surface to create a sophisticated glassmorphism effect.

---

## 3. Typography: Inter Editorial
We use **Inter** not as a functional font, but as a brand signifier. The hierarchy is extreme to ensure a premium, authoritative feel.

*   **Headlines (w800):** Used for main page titles. Large, tight letter-spacing (-0.02em) to mimic high-end print.
*   **Titles (w700):** Used for card headers. Provides instant scannability.
*   **Labels (w600):** Used for buttons, table headers, and input labels. All-caps for table headers to increase professional rigor.
*   **Body (w400):** Optimized for data density.

| Level | Size | Weight | Intent |
| :--- | :--- | :--- | :--- |
| **Display-LG** | 3.5rem | 800 | Impact metrics / Hero numbers |
| **Headline-SM** | 1.5rem | 700 | Section titles |
| **Title-SM** | 1rem | 700 | Card titles |
| **Label-MD** | 0.75rem | 600 | Metadata & Table headers |
| **Body-MD** | 0.875rem | 400 | Standard data entry |

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are a crutch. In this design system, depth is achieved through **The Layering Principle**.

*   **The Stack:** Place a `Surface Lowest` (#FFFFFF) card on a `Scaffold Background` (#F0F2F5). This 2-point value shift creates a natural "lift."
*   **Ambient Shadows:** For floating modals, use a "Fire-Tinted" shadow: `rgba(140, 37, 16, 0.04)` with a 24px blur. This makes the shadow feel like a natural part of the warm environment.
*   **The Ghost Border:** If a container requires more definition, use `Border Gray (#E4E7EC)` at **15% opacity**. It should be felt, not seen.
*   **Microanimations:** All state changes (hover, active, focus) must use a **200ms ease-out** transition. A button shouldn't just change color; it should "glow" into its active state.

---

## 5. Components

### Buttons
*   **Primary:** Ember Gradient background, white text, 10px radius. On hover, increase the gradient saturation.
*   **Secondary:** White background with a Ghost Border. Text in Primary (`#BF391B`).
*   **Tertiary:** No background, no border. Heavy label (w600). Used for low-priority actions like "Cancel."

### Cards & Lists
*   **Rule:** Forbid divider lines between list items.
*   **Execution:** Separate items using 16px of vertical white space or a subtle background shift (`#F8F9FA`) on hover. 
*   **Radius:** Always 14px. This "soft-modern" radius contrasts against the sharp typography.

### Input Fields
*   **Surface:** Off-White (`#F8F9FA`).
*   **Focus State:** 2px Ghost Border using the Primary color at 30% opacity. No "glow" shadows—keep it sharp.
*   **Radius:** 10px to match buttons.

### Restaurant-Specific Components
*   **Table Status Pills:** 
    *   *Available:* Success Green (`#1A8952`) with 10% opacity background.
    *   *Reserved:* Blue Info (`#1A6FBF`) with 10% opacity background.
*   **Order Pulse:** Pending orders (`#F59E0B`) should feature a subtle 2s breathing animation to signal urgency to the staff.

---

## 6. Do's and Don'ts

### Do:
*   **Use White Space as a Tool:** Give the "Outer Padding" (28px) room to breathe. High-end design feels expensive because it isn't crowded.
*   **Align to the Baseline:** Ensure all data in tables aligns perfectly to the Inter baseline.
*   **Tint Your Neutrals:** Ensure your "Blacks" and "Grays" have a tiny hint of warmth (red/orange) to keep the "Brasero" feel consistent.

### Don't:
*   **Don't Use Pure Gray (#888888):** It feels "dead." Always use `Text Muted (#9AA0A6)` or a tinted variant.
*   **Don't Use 1px Dividers:** If you feel the need to separate two sections, increase the gap from 20px to 40px instead.
*   **Don't Use Default Material Icons:** Use the "Rounded" set and ensure the stroke weight matches the weight of your body text.

---

## 7. Spacing Scale
*   **Outer Page Padding:** 28px (The "Breathing Room").
*   **Component Gaps:** 16px (Standard) / 20px (Loose).
*   **Internal Card Padding:** 24px.