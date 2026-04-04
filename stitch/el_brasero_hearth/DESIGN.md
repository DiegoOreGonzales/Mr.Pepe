# Design System Strategy: El Brasero Professional Management

## 1. Overview & Creative North Star: "The Culinary Hearth"
This design system moves away from the cold, clinical nature of standard POS software toward a "Culinary Hearth" aesthetic. The goal is to balance the visceral warmth of a traditional rotisserie with the high-stakes precision of industrial kitchen management. 

Instead of a standard "grid of boxes," this system utilizes an **Editorial Layout** approach. We use high-contrast typography, intentional asymmetry, and "The No-Line Rule" to create a workspace that feels like a premium chef’s lookbook rather than a spreadsheet. The interface must be trustworthy enough for the back-of-house and sophisticated enough for the front-of-house manager.

## 2. Colors: Tonal Depth & Warmth
Our palette is rooted in the embers of the grill—deep ambers and burnt oranges—stabilized by professional blue-greys.

### The "No-Line" Rule
To achieve a high-end feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries are defined through:
*   **Tonal Shifts:** Placing a `surface_container_lowest` card on a `surface_container_low` background.
*   **Shadow Depth:** Using elevation to imply edges without hard lines.

### Signature Textures & Glass
*   **The Ember Gradient:** For primary CTAs and critical data headers, use a linear gradient from `primary` (#944a00) to `primary_container` (#E67E22) at a 135° angle. This adds "soul" and visual weight.
*   **Glassmorphism:** Floating elements (like order modifiers or logout confirmations) must use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. This keeps the kitchen staff grounded in the current context while focusing on the task.

### Color Role Mapping
*   **Surface Hierarchy:** 
    *   App Background: `surface` (#f7f9ff).
    *   Main Content Areas: `surface_container_low` (#edf4ff).
    *   Interactive Cards: `surface_container_lowest` (#ffffff).
*   **Action Tones:** 
    *   `primary`: Core actions (Place Order).
    *   `tertiary`: Informational/Management (Inventory/Reports).
    *   `error`: Critical alerts (Order Cancelled/Low Stock).

## 3. Typography: Editorial Authority
We utilize two distinct typefaces to separate "Action" from "Information."

*   **Display & Headlines (Plus Jakarta Sans):** Used for big-picture numbers (Daily Revenue, Table Numbers). The geometric nature of Jakarta Sans provides an authoritative, modern feel.
*   **Body & Labels (Be Vietnam Pro):** Used for legibility in high-speed environments. This font excels at small scales (Ingredients, Customer Notes).

| Level | Token | Font | Size | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-md` | Plus Jakarta Sans | 2.75rem | Hero Sales Numbers / Table Totals |
| **Headline** | `headline-sm` | Plus Jakarta Sans | 1.5rem | Section Headers (Kitchen Feed) |
| **Title** | `title-lg` | Be Vietnam Pro | 1.375rem | Card Titles / Dish Names |
| **Body** | `body-md` | Be Vietnam Pro | 0.875rem | Order Details / Modifier Lists |
| **Label** | `label-md` | Be Vietnam Pro | 0.75rem | Secondary metadata (Time elapsed) |

## 4. Elevation & Depth: Tonal Layering
Traditional management apps look cluttered because of heavy shadows. This system uses **Ambient Layering**.

*   **The Layering Principle:** Depth is achieved by stacking surface tiers. A `surface_container_highest` element represents a "pressed" or "active" state, whereas `surface_container_lowest` represents a "raised" interactive card.
*   **Ambient Shadows:** For floating elements, use a highly diffused shadow: `box-shadow: 0px 8px 24px rgba(9, 29, 46, 0.06)`. The shadow color is a tint of our `on_surface` blue-grey, making it feel like natural light rather than digital mud.
*   **The "Ghost Border":** If a separation is required for accessibility, use the `outline_variant` token at 15% opacity. It should be felt, not seen.

## 5. Components

### Interactive Elements
*   **Primary Buttons:** Height `48px`, Radius `roundedness.full` (24px). Use the Ember Gradient. Text must be `on_primary` (#ffffff) with a `label-md` bold weight.
*   **Action Chips:** For filtering "Chicken," "Sides," and "Drinks." Use `secondary_container` (#fea520) with `on_secondary_container` text. Use `roundedness.md` (1.5rem) for a friendly, touchable feel.
*   **The Kitchen Card:** 
    *   Radius: `roundedness.DEFAULT` (1rem/12px).
    *   No Dividers: Separate order items using `spacing.4` (1rem) of vertical whitespace.
    *   Status Indicator: A vertical 4px bar on the left using `primary` (Pending) or `success` (Ready).

### Input & Feedback
*   **Quantity Selectors:** Large, 48x48px touch targets for + and - buttons to prevent errors during high-volume service.
*   **Navigation Rail:** On the left side of the 1280x800 layout, use a `surface_container_low` rail. Icons should use `primary` when active and `outline` when inactive. 

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical spacing. If the left margin is `spacing.8`, try a `spacing.12` right margin to create an editorial, "breathable" feel.
*   **Do** use `surface_bright` to highlight the most important active order in a list.
*   **Do** prioritize large touch targets (min 48dp) to accommodate greasy or busy hands in a kitchen environment.

### Don't
*   **Don't** use black (#000000) for text. Always use `on_surface` (#091d2e) to maintain the premium tonal balance.
*   **Don't** use divider lines between list items. Use a background color toggle (Zebra striping using `surface` and `surface_container_low`) or whitespace.
*   **Don't** use standard Material shadows. Always use the diffused, tinted Ambient Shadows defined in section 4.