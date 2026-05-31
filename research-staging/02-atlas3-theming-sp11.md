# Atlas 3 Theming & Styling - Studio Pro 11+ Reference

## Deep Beast Mode Research Harvest - January 2025

> **Status**: RESEARCH STAGING - Needs validation before adding to knowledge base
> **Source**: Official Mendix Docs
> **Target**: Studio Pro 11+ (Atlas 3)

---

## 1. File & Folder Structure

Atlas 3 uses a modular styling approach:

```
your-app/
├── theme/                          # App-specific styling
│   ├── web/
│   │   ├── custom-variables.scss   # Theme settings (colors, fonts, spacing)
│   │   ├── main.scss               # Entry point for custom styling
│   │   ├── exclusion-variables.scss # Toggle Atlas base styling on/off
│   │   └── settings.json           # CSS files to load
│   └── native/
│       ├── custom-variables.js     # Theme settings for native
│       ├── main.js                 # Entry point for native styling
│       └── exclusionVariables.js   # Toggle Atlas base styling
│
└── themesource/                    # Module-level styling (reusable)
    ├── atlas_core/                 # NEVER MODIFY - Core Atlas styles
    │   ├── web/
    │   └── native/
    └── {your_module}/              # Your custom theme module
        ├── web/
        │   ├── main.scss
        │   └── design-properties.json
        ├── native/
        │   ├── main.js
        │   └── design-properties.json
        └── public/                 # Static assets (images, fonts)
```

---

## 2. Custom Variables (Web - SCSS)

`theme/web/custom-variables.scss`:

```scss
// ==========================================================================
// Brand Colors
// ==========================================================================
$brand-primary: #264ae5;
$brand-success: #3cb33d;
$brand-warning: #eca51c;
$brand-danger: #e33f4e;
$brand-info: #0086d9;

// Default/Secondary
$gray-primary: #e7e7e9;
$brand-default: $gray-primary;

// Light variants (for backgrounds, etc.)
$brand-primary-light: #f3f5ff;
$brand-success-light: #f1fcf1;
$brand-warning-light: #fff9e6;
$brand-danger-light: #ffeef0;
$brand-info-light: #ecf9ff;

// ==========================================================================
// Typography
// ==========================================================================
// Font family (Google Fonts by default, can serve locally)
$font-family-import: 'https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700';
// Or serve locally:
// $font-family-import: "./fonts/open-sans.css";

$font-family-base: 'Open Sans', sans-serif;
$font-size-base: 14px;
$font-weight-normal: 400;
$font-weight-semibold: 600;
$font-weight-bold: 700;

$line-height-base: 1.5;

// Headings
$font-size-h1: 2rem;
$font-size-h2: 1.75rem;
$font-size-h3: 1.5rem;
$font-size-h4: 1.25rem;
$font-size-h5: 1rem;
$font-size-h6: 0.875rem;

// ==========================================================================
// Spacing
// ==========================================================================
$spacing-smallest: 4px;
$spacing-small: 8px;
$spacing-medium: 16px;
$spacing-large: 24px;
$spacing-largest: 32px;

// ==========================================================================
// Border Radius
// ==========================================================================
$border-radius-small: 4px;
$border-radius-default: 8px;
$border-radius-large: 12px;

// ==========================================================================
// Shadows
// ==========================================================================
$shadow-small: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-medium: 0 4px 8px rgba(0, 0, 0, 0.1);
$shadow-large: 0 8px 16px rgba(0, 0, 0, 0.1);

// ==========================================================================
// Form Elements
// ==========================================================================
$form-input-bg: #ffffff;
$form-input-border-color: #ced0d3;
$form-input-border-radius: $border-radius-default;
$form-input-height: 36px;
$form-input-padding-x: 12px;
$form-input-padding-y: 8px;

// Focus states
$form-input-focus-border-color: $brand-primary;
$form-input-focus-shadow: 0 0 0 3px rgba($brand-primary, 0.2);

// ==========================================================================
// Buttons
// ==========================================================================
$btn-font-weight: $font-weight-semibold;
$btn-border-radius: $border-radius-default;

// Button sizes
$btn-padding-y: 8px;
$btn-padding-x: 16px;
$btn-padding-y-sm: 4px;
$btn-padding-x-sm: 12px;
$btn-padding-y-lg: 12px;
$btn-padding-x-lg: 24px;

// ==========================================================================
// Navigation
// ==========================================================================
$navigation-bg: #252c36;
$navigation-color: #ffffff;
$navigation-item-hover-bg: rgba(255, 255, 255, 0.1);
$navigation-item-active-bg: $brand-primary;

// ==========================================================================
// Layout
// ==========================================================================
$sidebar-width: 250px;
$topbar-height: 60px;

// Breakpoints
$screen-sm: 576px;
$screen-md: 768px;
$screen-lg: 992px;
$screen-xl: 1200px;
```

---

## 3. Custom Variables (Native - JavaScript)

`theme/native/custom-variables.js`:

```javascript
// ==========================================================================
// Brand Colors
// ==========================================================================
export const brand = {
  primary: '#264AE5',
  success: '#3CB33D',
  warning: '#ECA51C',
  danger: '#E33F4E',
  info: '#0086D9',
  primaryLight: '#F3F5FF',
  successLight: '#F1FCF1',
  warningLight: '#FFF9E6',
  dangerLight: '#FFEEF0',
  infoLight: '#ECF9FF',
};

// ==========================================================================
// Typography
// ==========================================================================
export const font = {
  family: 'Open Sans',
  size: 14,
  sizeSmall: 12,
  sizeLarge: 16,
  sizeH1: 32,
  sizeH2: 28,
  sizeH3: 24,
  sizeH4: 20,
  sizeH5: 16,
  sizeH6: 14,
  weightLight: '300',
  weightNormal: '400',
  weightSemibold: '600',
  weightBold: '700',
  lineHeight: 1.5,
};

// ==========================================================================
// Spacing
// ==========================================================================
export const spacing = {
  smallest: 4,
  small: 8,
  medium: 16,
  large: 24,
  largest: 32,
};

// ==========================================================================
// Border
// ==========================================================================
export const border = {
  color: '#CED0D3',
  width: 1,
  radiusSmall: 4,
  radius: 8,
  radiusLarge: 12,
};

// ==========================================================================
// Background & Contrast
// ==========================================================================
export const background = {
  primary: '#FFFFFF',
  secondary: '#F8F8F8',
  gray: '#E7E7E9',
  dark: '#252C36',
};

export const contrast = {
  lowest: '#FFFFFF',
  lower: '#F8F8F8',
  low: '#E7E7E9',
  regular: '#CED0D3',
  high: '#6C717A',
  higher: '#3B4251',
  highest: '#0A1325',
};

// ==========================================================================
// Button
// ==========================================================================
export const button = {
  fontSize: font.size,
  fontWeight: font.weightSemibold,
  borderRadius: border.radius,
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.medium,
};

// ==========================================================================
// Input
// ==========================================================================
export const input = {
  backgroundColor: background.primary,
  borderColor: border.color,
  borderWidth: border.width,
  borderRadius: border.radius,
  fontSize: font.size,
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.medium,
  height: 40,
};
```

---

## 4. Adding Custom Styling

### 4.1 Web (SCSS)

Create modular SCSS files and import them:

`theme/web/components/_company-header.scss`:

```scss
.company-header {
  font-size: 30px;
  font-weight: $font-weight-bold;
  color: $brand-primary;
  padding: $spacing-medium;
  border-bottom: 2px solid $brand-primary;

  &__logo {
    height: 40px;
    margin-right: $spacing-small;
  }

  &__title {
    flex: 1;
  }

  // Responsive
  @media (max-width: $screen-md) {
    font-size: 24px;
    padding: $spacing-small;
  }
}
```

`theme/web/main.scss`:

```scss
// Import custom variables first (for access to $variables)
@import 'custom-variables';

// Import component files
@import 'components/company-header';
@import 'components/dashboard-card';
@import 'components/custom-table';

// Or add styles directly
.my-custom-class {
  background: $brand-primary-light;
  border-radius: $border-radius-default;
  padding: $spacing-medium;
}
```

### 4.2 Native (JavaScript)

`theme/native/components/companyHeader.js`:

```javascript
import { brand, font, spacing } from '../custom-variables';

export const companyHeader = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 2,
    borderBottomColor: brand.primary,
  },
  logo: {
    height: 40,
    marginRight: spacing.small,
  },
  title: {
    flex: 1,
    fontSize: 30,
    fontWeight: font.weightBold,
    color: brand.primary,
  },
};
```

`theme/native/main.js`:

```javascript
// Re-export all styling
export * from './custom-variables';
export * from './components/companyHeader';
export * from './components/dashboardCard';
export * from './components/customTable';

// Or define directly
export const myCustomClass = {
  backgroundColor: brand.primaryLight,
  borderRadius: border.radius,
  padding: spacing.medium,
};
```

---

## 5. Exclusion Variables (Disable Atlas Defaults)

### 5.1 Web Exclusions

`theme/web/exclusion-variables.scss`:

```scss
// Set to true to disable default Atlas styling for widgets
// This allows you to start from scratch

// Core UI
$exclude-button: false;
$exclude-button-helpers: false; // Variants like btn-primary, btn-success
$exclude-input: false;
$exclude-label: false;
$exclude-label-helpers: false;

// Layout
$exclude-layout-grid: false;
$exclude-data-grid: false;
$exclude-data-grid-helpers: false;
$exclude-list-view: false;
$exclude-list-view-helpers: false;
$exclude-template-grid: false;
$exclude-template-grid-helpers: false;
$exclude-data-view: false;

// Containers
$exclude-group-box: false;
$exclude-group-box-helpers: false;
$exclude-tab-container: false;
$exclude-tab-container-helpers: false;
$exclude-modal: false;

// Navigation
$exclude-header: false;
$exclude-navigation-bar: false;
$exclude-navigation-bar-helpers: false;
$exclude-navigation-list: false;
$exclude-navigation-tree: false;
$exclude-navigation-tree-helpers: false;
$exclude-simple-menu-bar: false;
$exclude-simple-menu-bar-helpers: false;

// Form Elements
$exclude-check-box: false;
$exclude-radio-button: false;
$exclude-custom-switch: false;
$exclude-data-picker: false;

// Progress & Rating
$exclude-progress: false;
$exclude-progress-bar: false;
$exclude-progress-bar-helpers: false;
$exclude-progress-circle: false;
$exclude-progress-circle-helpers: false;
$exclude-rating: false;
$exclude-rating-helpers: false;

// Misc
$exclude-badge: false;
$exclude-badge-button: false;
$exclude-badge-button-helpers: false;
$exclude-pagination: false;
$exclude-pop-up-menu: false;
$exclude-slider: false;
$exclude-slider-helpers: false;
$exclude-range-slider: false;
$exclude-range-slider-helpers: false;
$exclude-timeline: false;
$exclude-table: false;
$exclude-table-helpers: false;
$exclude-typography: false;
$exclude-typography-helpers: false;
$exclude-background-helpers: false;
$exclude-helper-classes: false;
$exclude-image-helpers: false;
$exclude-glyphicon: false;
$exclude-grid: false;
$exclude-custom-dijit-widget: false;
```

### 5.2 Native Exclusions

`theme/native/exclusionVariables.js`:

```javascript
// Set to true to disable default Atlas styling
export const excludeButtons = false;
export const excludeButtonsHelpers = false;

export const excludeActivityIndicator = false;
export const excludeActivityIndicatorHelpers = false;
export const excludeAnimation = false;
export const excludeBackgroundImage = false;
export const excludeBadge = false;
export const excludeBadgeHelpers = false;
export const excludeBottomSheet = false;
export const excludeCarousel = false;
export const excludeCheckBox = false;
export const excludeColorPicker = false;
export const excludeContainer = false;
export const excludeDatePicker = false;
export const excludeDropDown = false;
export const excludeFeedback = false;
export const excludeFAB = false;
export const excludeFABHelpers = false;
export const excludeImage = false;
export const excludeImageHelpers = false;
export const excludeIntroScreen = false;
export const excludeIntroScreenHelpers = false;
export const excludeLayoutGrid = false;
export const excludeLineChart = false;
export const excludeLineChartHelpers = false;
export const excludeBarChart = false;
export const excludeBarChartHelpers = false;
export const excludeListView = false;
export const excludeListViewHelpers = false;
export const excludeListViewSwipe = false;
export const excludeListViewSwipeHelpers = false;
export const excludeMaps = false;
export const excludeMapsHelpers = false;
export const excludePageTitle = false;
export const excludeProgressBar = false;
export const excludeProgressBarHelpers = false;
export const excludeProgressCircle = false;
export const excludeProgressCircleHelpers = false;
export const excludePopUpMenu = false;
export const excludeQRCode = false;
export const excludeRangeSlider = false;
export const excludeRangeSliderHelpers = false;
export const excludeRating = false;
export const excludeReferenceSelector = false;
export const excludeSafeAreaView = false;
export const excludeSlider = false;
export const excludeSliderHelpers = false;
export const excludeTabContainer = false;
export const excludeTabContainerHelpers = false;
export const excludeTextArea = false;
export const excludeTextBox = false;
export const excludeTextBoxHelpers = false;
export const excludeToggleButtons = false;
export const excludeTypography = false;
export const excludeTypographyHelpers = false;
export const excludeVideoPlayer = false;
export const excludeWebView = false;
export const excludeHelpers = false;
```

---

## 6. Creating a Theme Module (Reusable)

### Step 1: Create Module

Right-click App → Add module... → Name it (e.g., "CompanyTheme")

### Step 2: Mark as UI Resources Module

Right-click module → "Mark as UI resources module" (green icon)

### Step 3: Create Theme Files

`themesource/companytheme/web/custom-variables.scss`:

```scss
$gray-primary: #e7e7e9;
$brand-default: $gray-primary;
$brand-primary: #264ae5;
$brand-success: #3cb33d;
$brand-warning: #eca51c;
$brand-danger: #e33f4e;
```

`themesource/companytheme/web/main.scss`:

```scss
// Import variables from this module
@import 'custom-variables';

// Add module-specific styles
.company-widget {
  // styles
}
```

### Step 4: Point App Theme to Module

`theme/web/custom-variables.scss`:

```scss
// Import from theme module instead of defining here
@import '../../themesource/companytheme/web/custom-variables.scss';

// Any variables here will OVERRIDE the module
// $brand-primary: #FF0000; // Would override module's primary color
```

### Step 5: Set Module Order

App Settings → Theme → Order UI resource modules
(Lower = higher precedence)

---

## 7. Design Properties

Create design properties for easy Studio Pro configuration:

`themesource/companytheme/web/design-properties.json`:

```json
{
  "Container": {
    "Spacing": {
      "options": [
        {
          "name": "No spacing",
          "class": "spacing-none"
        },
        {
          "name": "Small",
          "class": "spacing-small"
        },
        {
          "name": "Medium",
          "class": "spacing-medium"
        },
        {
          "name": "Large",
          "class": "spacing-large"
        }
      ]
    },
    "Background": {
      "options": [
        {
          "name": "None",
          "class": ""
        },
        {
          "name": "Primary",
          "class": "bg-primary"
        },
        {
          "name": "Success",
          "class": "bg-success"
        },
        {
          "name": "Light Gray",
          "class": "bg-gray-light"
        }
      ]
    },
    "Shadow": {
      "options": [
        {
          "name": "None",
          "class": ""
        },
        {
          "name": "Small",
          "class": "shadow-sm"
        },
        {
          "name": "Medium",
          "class": "shadow-md"
        },
        {
          "name": "Large",
          "class": "shadow-lg"
        }
      ]
    }
  },
  "Button": {
    "Style": {
      "options": [
        {
          "name": "Default",
          "class": "btn-default"
        },
        {
          "name": "Primary",
          "class": "btn-primary"
        },
        {
          "name": "Success",
          "class": "btn-success"
        },
        {
          "name": "Warning",
          "class": "btn-warning"
        },
        {
          "name": "Danger",
          "class": "btn-danger"
        },
        {
          "name": "Link",
          "class": "btn-link"
        }
      ]
    },
    "Size": {
      "options": [
        {
          "name": "Small",
          "class": "btn-sm"
        },
        {
          "name": "Default",
          "class": ""
        },
        {
          "name": "Large",
          "class": "btn-lg"
        }
      ]
    }
  }
}
```

Corresponding SCSS:

```scss
// Spacing helpers
.spacing-none {
  padding: 0;
}
.spacing-small {
  padding: $spacing-small;
}
.spacing-medium {
  padding: $spacing-medium;
}
.spacing-large {
  padding: $spacing-large;
}

// Background helpers
.bg-primary {
  background-color: $brand-primary-light;
}
.bg-success {
  background-color: $brand-success-light;
}
.bg-gray-light {
  background-color: $gray-primary;
}

// Shadow helpers
.shadow-sm {
  box-shadow: $shadow-small;
}
.shadow-md {
  box-shadow: $shadow-medium;
}
.shadow-lg {
  box-shadow: $shadow-large;
}
```

---

## 8. Loading Third-Party CSS

`theme/web/settings.json`:

```json
{
  "cssFiles": ["theme.compiled.css", "vendor/fontawesome/css/all.min.css", "vendor/animate.css"]
}
```

Place CSS files in `theme/web/vendor/`.

---

## 9. Serving Fonts Locally

Instead of Google Fonts CDN:

1. Download fonts to `theme/web/fonts/`
2. Create `theme/web/fonts/open-sans.css`:

```css
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 300;
  src: url('./OpenSans-Light.woff2') format('woff2');
}
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  src: url('./OpenSans-Regular.woff2') format('woff2');
}
/* ... more weights */
```

3. Update custom-variables.scss:

```scss
$font-family-import: './fonts/open-sans.css';
```

---

## 10. Compilation Order

SCSS compiles in this order:

1. `themesource/` main.scss files:
   - Non-UI Marketplace modules (alphabetical)
   - UI resources modules (ordered in App Settings → Theme)
   - Non-UI user modules (App Explorer order)
2. `theme/web/custom-variables.scss`
3. `theme/web/main.scss`

**Important**: Lower modules in Theme settings = higher precedence (loaded last, wins)

---

## 11. Best Practices

| Practice                                 | Reason                           |
| ---------------------------------------- | -------------------------------- |
| Use variables, not hardcoded values      | Consistent theming, easy updates |
| Create theme module for reuse            | Export across apps               |
| BEM naming (`.block__element--modifier`) | Maintainable CSS                 |
| Mobile-first responsive design           | Better performance               |
| Use exclusion variables sparingly        | Atlas provides good defaults     |
| Test in multiple browsers                | CSS compatibility                |
| Use design properties                    | Non-technical users can style    |

---

## 12. Sources

- https://docs.mendix.com/howto/front-end/customize-styling-new/
- https://docs.mendix.com/howto/front-end/atlas-ui/
- https://docs.mendix.com/howto/front-end/extend-design-properties/
- https://docs.mendix.com/howto/front-end/create-a-company-design-system/
- https://atlas.mendix.com/
- https://atlasdesignsystem.mendixcloud.com/

---

**Next Steps for Validation:**

1. Test exclusion variables in SP11.5
2. Verify native styling compilation
3. Test design properties JSON schema
4. Validate CSS load order
