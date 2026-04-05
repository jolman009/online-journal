# Glassmorphism UI Patterns

JotFlow follows a "Glassmorphism" design system. Components use semi-transparent backgrounds with heavy background blur and subtle borders.

## CSS Variables

Use these variables from `src/styles.css` for consistent styling:

- **Backgrounds**:
  - `var(--card-bg)`: `rgba(255, 255, 255, 0.08)`
  - `var(--bg-main)`: `#0b1324`
- **Blur**:
  - `var(--glass-blur)`: `18px` (used in `backdrop-filter: blur(var(--glass-blur))`)
- **Accents**:
  - `var(--accent-blue)`: `#7dd3fc`
  - `var(--accent-green)`: `#22c55e`
  - `var(--text-primary)`: `#e8eefc`

## Component Boilerplate

### Glassmorphism Card

```jsx
<div className="glass-card">
  <h3>Card Title</h3>
  <p>Content goes here.</p>
</div>
```

**CSS for Glass Card**:

```css
.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

## Mandate: Aesthetic Guidelines

1.  **Pill-shaped Elements**: Buttons and tags should always be pill-shaped (`border-radius: 999px`).
2.  **Subtle Interactivity**: On hover, use `transform: translateY(-2px)` and `box-shadow` enhancement.
3.  **Radial Gradients**: Use the predefined `radial-gradient` backgrounds for page depth.
4.  **Icons**: Use high-signal icons (typically SVG or icon libraries like Lucide) that fit the tech-minimalist aesthetic.
