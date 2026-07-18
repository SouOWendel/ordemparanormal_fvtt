# SCSS Architecture Reference

This document provides a quick reference for the SCSS modular structure.

## Directory Structure

```
scss/
├── utils/                      ← Variables, mixins, colors, typography
│   ├── _colors.scss           ← Color palette (50+ variables)
│   ├── _variables.scss        ← Spacing, radius, font sizes
│   ├── _mixins.scss           ← Reusable mixins (badge, state, card)
│   └── _typography.scss       ← Font definitions
├── global/                     ← Base styles
│   ├── _flex.scss             ← Flexbox utilities
│   ├── _grid.scss             ← Grid utilities
│   └── _window.scss           ← Window base styles
├── components/                 ← Component-specific styles
│   ├── _cards.scss            ← Chat cards
│   ├── _chat.scss             ← Chat & dice rolls
│   ├── _combat.scss           ← Combat QoL features
│   ├── _dialog.scss           ← Dialogs
│   ├── _effects.scss          ← Active effects
│   ├── _formApp.scss          ← Form applications
│   ├── _forms.scss            ← Form controls
│   ├── _items.scss            ← Item sheets
│   ├── _resource.scss         ← Resource bars
│   └── _sidebar.scss          ← Sidebar
└── ordemparanormal.scss        ← Main entry point
```

---

## Quick Reference

### Colors (`@use "../utils/colors"`)

#### Core Colors

```scss
colors.$c-white
colors.$c-black
colors.$c-dark
```

#### Gray Scale

```scss
colors.$c-gray-darkest    // #161616
colors.$c-gray-dark       // #222
colors.$c-gray-medium     // #555
colors.$c-gray-light      // #b8b8b8
colors.$c-gray-lighter    // #ccc
```

#### Parchment Theme (sistema Ordem Paranormal)

```scss
colors.$c-parchment-lightest  // #f7f3e8
colors.$c-parchment-light     // #eeede0
colors.$c-parchment           // #e7d1b1
colors.$c-faint               // #c9c7b8
colors.$c-beige               // #b5b3a4
```

#### Feedback Colors

```scss
// Success (green)
colors.$c-success             // #2e7d32
colors.$c-success-bg          // rgba(46, 125, 50, 0.1)
colors.$c-success-border      // rgba(46, 125, 50, 0.3)

// Error (red)
colors.$c-error               // #c62828
colors.$c-error-bg            // rgba(198, 40, 40, 0.1)
colors.$c-error-border        // rgba(198, 40, 40, 0.3)

// Warning
colors.$c-warning             // #f9a825 (golden)
```

#### Action Type Badges (Combat)

```scss
colors.$c-action-standard     // #1565c0 (blue)
colors.$c-action-free         // #2e7d32 (green)
colors.$c-action-movement     // #f57f17 (yellow)
colors.$c-action-reaction     // #e65100 (orange)
colors.$c-action-full         // #b71c1c (red)
```

#### Overlays

```scss
colors.$c-overlay-light       // rgba(0, 0, 0, 0.05)
colors.$c-overlay-medium      // rgba(0, 0, 0, 0.13)
colors.$c-overlay-dark        // rgba(0, 0, 0, 0.4)
colors.$c-overlay-white       // rgba(255, 255, 255, 0.1)
```

---

### Variables (`@use "../utils/variables"`)

#### Spacing Scale

```scss
variables.$spacing-xs         // 2px
variables.$spacing-sm         // 4px
variables.$spacing-md         // 6px
variables.$spacing-lg         // 10px
variables.$spacing-xl         // 12px
variables.$spacing-2xl        // 20px
```

#### Border Radius

```scss
variables.$radius-sm          // 3px
variables.$radius-md          // 4px
variables.$radius-lg          // 5px
variables.$radius-xl          // 6px
```

#### Font Sizes

```scss
variables.$font-xs            // 10px
variables.$font-sm            // 11px
variables.$font-md            // 12px
variables.$font-base          // 13px
variables.$font-lg            // 14px
variables.$font-xl            // 15px
```

---

### Mixins (`@use "../utils/mixins"`)

#### Badge Mixin

```scss
@include mixins.badge($bg-color, $text-color: colors.$c-white);

// Example:
.my-badge {
	@include mixins.badge(colors.$c-action-standard);
}
```

#### State Mixins (Success/Failure)

```scss
@include mixins.state-success; // Green feedback
@include mixins.state-failure; // Red feedback

// Example:
.result.success {
	@include mixins.state-success;
}
```

#### Card Base Styling

```scss
@include mixins.card-base;

// Example:
.my-card {
	@include mixins.card-base;
}
```

#### Visibility Mixins

```scss
@include mixins.element-invisible; // Accessibility-friendly hidden
@include mixins.hide; // Display: none
```

---

## Usage Example

```scss
// my-component.scss
@use "../utils/colors";
@use "../utils/variables";
@use "../utils/mixins";

.my-component {
	padding: variables.$spacing-md;
	border-radius: variables.$radius-md;
	background: colors.$c-parchment-light;

	.success-badge {
		@include mixins.badge(colors.$c-success);
	}

	.status {
		&.success {
			@include mixins.state-success;
		}

		&.failure {
			@include mixins.state-failure;
		}
	}
}
```

---

## Best Practices

1. ✅ **Always import utils** at the top of component files:

   ```scss
   @use "../utils/colors";
   @use "../utils/variables";
   @use "../utils/mixins";
   ```

2. ✅ **Use variables instead of hardcoded values**:

   ```scss
   // ❌ Bad
   color: #2e7d32;
   padding: 4px;

   // ✅ Good
   color: colors.$c-success;
   padding: variables.$spacing-sm;
   ```

3. ✅ **Use mixins for repeated patterns**:

   ```scss
   // ❌ Bad (repeated code)
   .badge-1 {
   	font-size: 10px;
   	font-weight: bold;
   	padding: 1px 4px;
   	border-radius: 3px;
   	background: blue;
   }

   // ✅ Good (reusable)
   .badge-1 {
   	@include mixins.badge(colors.$c-action-standard);
   }
   ```

4. ✅ **Never edit `css/ordemparanormal.css` directly** — always edit SCSS sources

5. ✅ **Run `npm run sass` after editing SCSS** to recompile CSS

---

## Workflow

1. **Edit** SCSS file in `scss/components/` or `scss/utils/`
2. **Compile** with `npm run sass` (or let watch mode auto-compile)
3. **Test** with `npm test`
4. **Commit** only SCSS changes (CSS is auto-generated)

---
