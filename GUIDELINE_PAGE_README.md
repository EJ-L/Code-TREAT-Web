# User Guideline Page - Implementation Complete

## Overview
A comprehensive user manual page has been added to the Code TREAT website, accessible via a "?" icon in the sidebar.

## Features Implemented

### 1. Navigation
- **Sidebar Integration**: Added "User Guide" option with a question mark icon (?) in the sidebar
- **URL Routing**: Accessible via `#guide` hash in the URL
- **Mobile & Desktop**: Fully responsive design that works on all screen sizes

### 2. Page Structure
- **Hero Section**: Eye-catching header with icon, title, and description
- **Content Section**: Organized, collapsible sections based on `user_guideline.md`

### 3. Content Organization
The guideline follows a hierarchical structure:
- **Sections** (# in markdown) - Main categories (e.g., "Leaderboard", "Additional")
- **Subsections** (## in markdown) - Feature groups (e.g., "Filtering", "Chart View")
- **Items** (### in markdown) - Specific questions with step-by-step instructions

### 4. Interactive Features
- **Collapsible Sections**: Click section headers to expand/collapse content
- **Collapsible Items**: Click question headers to show/hide detailed steps
- **Smooth Animations**: Framer Motion animations for elegant transitions
- **Dark/Light Mode Support**: Fully styled for both themes

### 5. Responsive Image System
- **Device Detection**: Automatically detects if user is on mobile or desktop
- **Adaptive Images**: Shows PC screenshots on desktop, mobile screenshots on mobile devices
- **Fallback System**: Uses placeholder.svg when images are missing

## Files Created

### Components
- `src/app/components/pages/GuidelinePage.tsx` - Main page component
- `src/app/components/sections/GuidelineHero.tsx` - Hero section with title
- `src/app/components/sections/GuidelineContent.tsx` - Content with collapsible sections

### Modified Files
- `src/app/page.tsx` - Added guide section routing
- `src/app/components/layout/Sidebar.tsx` - Added "User Guide" navigation

### Documentation
- `public/guidelines/placeholder.md` - Instructions for adding screenshots
- `public/guidelines/placeholder.svg` - Fallback placeholder image

## Next Steps - Adding Screenshots

To complete the user guide, you need to add screenshot images to the `/public/guidelines/` directory:

### Required Screenshots

#### Leaderboard - Filtering
1. `timeline-filter-pc.png` & `timeline-filter-mobile.png`
2. `filters-available-pc.png` & `filters-available-mobile.png`
3. `additional-filters-pc.png` & `additional-filters-mobile.png`

#### Leaderboard - Chart View
4. `chart-view-pc.png` & `chart-view-mobile.png`
5. `chart-interactions-pc.png` & `chart-interactions-mobile.png`

#### Leaderboard - Table View
6. `table-adjust-pc.png` & `table-adjust-mobile.png`

#### Leaderboard - Compare
7. `compare-open-pc.png` & `compare-open-mobile.png`
8. `compare-section-pc.png` & `compare-section-mobile.png`
9. `compare-models-pc.png` & `compare-models-mobile.png`

#### Leaderboard - Exporting
10. `export-pc.png` & `export-mobile.png`

#### Additional - Sidebar
11. `dark-mode-pc.png` & `dark-mode-mobile.png`

### Screenshot Guidelines
- **Format**: PNG preferred for quality
- **Desktop Resolution**: ~1920x1080 or similar
- **Mobile Resolution**: ~375x812 or similar
- **Quality**: High-quality, clear screenshots
- **Annotations**: Consider adding highlights or arrows to emphasize UI elements

## Usage

### For Users
1. Click the "?" icon or "User Guide" in the sidebar
2. Click on any section to expand it (e.g., "Leaderboard")
3. Click on any question to see detailed steps and screenshots
4. The appropriate screenshot (PC/Mobile) will be shown based on your device

### For Developers
The guideline content is structured in the `GuidelineContent.tsx` component as a data structure. To add new guidelines:

1. Edit the `guidelineData` array in `GuidelineContent.tsx`
2. Follow the existing structure: Section → Subsection → Item
3. Add image paths in the `images` object with `pc` and `mobile` properties
4. The component will automatically render the new content

Example:
```typescript
{
  question: "How to do something new",
  steps: [
    "Step 1: Do this",
    "Step 2: Do that"
  ],
  images: {
    pc: "/guidelines/new-feature-pc.png",
    mobile: "/guidelines/new-feature-mobile.png"
  }
}
```

## Styling
- Follows the overall Code TREAT design system
- Gradient headers (blue to purple)
- Consistent spacing and typography
- Smooth hover states and transitions
- Accessible color contrast in both themes

## Technical Details
- **Framework**: Next.js with React
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **Responsive**: Tailwind CSS utilities
- **Image Handling**: Next.js Image component with error fallback
- **Device Detection**: Window resize event listener

## Testing Checklist
- [x] Navigation from sidebar works
- [x] URL routing (#guide) works
- [x] Collapsible sections work
- [x] Collapsible items work
- [x] Dark/Light mode styling correct
- [x] Mobile responsive layout
- [x] Desktop layout
- [ ] All screenshots added (pending)
- [ ] Screenshots display correctly on PC
- [ ] Screenshots display correctly on mobile

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive breakpoints: mobile (<768px), desktop (≥768px)

