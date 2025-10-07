# Image Organization Guide

## Directory Structure
```
public/guidelines/
├── desktop/          # Desktop/PC version images
├── mobile/           # Mobile version images  
├── placeholder.svg   # Fallback image
└── placeholder.md    # Placeholder reference
```

## Naming Convention

### Single Images
- Desktop: `{feature-name}-pc.png`
- Mobile: `{feature-name}-mobile.png`

### Multiple Images (Steps)
- Desktop: `{feature-name}-pc-1.png`, `{feature-name}-pc-2.png`, etc.
- Mobile: `{feature-name}-mobile-1.png`, `{feature-name}-mobile-2.png`, etc.

## Current Image Mappings

### Timeline Filter
- Desktop: `timeline-filter-pc-1.png`, `timeline-filter-pc-2.png`
- Mobile: `timeline-filter-mobile-1.png`, `timeline-filter-mobile-2.png`

### Filters Available
- Desktop: `filters-available-pc-1.png`, `filters-available-pc-2.png`
- Mobile: `filters-available-mobile-1.png`, `filters-available-mobile-2.png`

### Additional Filters (Code Robustness)
- Desktop: `additional-filters-pc-1.png`, `additional-filters-pc-2.png`
- Mobile: `additional-filters-mobile-1.png`, `additional-filters-mobile-2.png`

### Chart View
- Desktop: `chart-view-pc.png`
- Mobile: `chart-view-mobile.png`

### Chart Interactions
- Desktop: `chart-interactions-pc-1.png`, `chart-interactions-pc-2.png`
- Mobile: `chart-interactions-mobile-1.png`, `chart-interactions-mobile-2.png`

### Table Adjustments
- Desktop: `table-adjust-pc-1.png` through `table-adjust-pc-6.png`
- Mobile: `table-adjust-mobile-1.png` through `table-adjust-mobile-6.png`

### Compare Features
- Desktop: `compare-open-pc.png`, `compare-section-pc.png`
- Desktop: `compare-models-pc-1.png` through `compare-models-pc-4.png`
- Mobile: `compare-open-mobile.png`, `compare-section-mobile.png`
- Mobile: `compare-models-mobile-1.png` through `compare-models-mobile-4.png`

### Export
- Desktop: `export-pc-1.png`
- Mobile: `export-mobile-1.png`

### Dark Mode
- Desktop: `dark-mode-pc-1.png`, `dark-mode-pc-2.png`, `dark-mode-pc-3.png`
- Mobile: `dark-mode-mobile-1.png`, `dark-mode-mobile-2.png`, `dark-mode-mobile-3.png`

### Navigation (New)
- Desktop: `navigation-pc.png`
- Mobile: `navigation-mobile.png`

### Task Types (New)
- Desktop: `task-types-pc.png`
- Mobile: `task-types-mobile.png`

### Troubleshooting (New)
- Desktop: `troubleshooting-pc.png`, `missing-models-pc.png`
- Mobile: `troubleshooting-mobile.png`, `missing-models-mobile.png`

## Image Requirements

### Size Guidelines
- Desktop images: Recommended max width 1200px
- Mobile images: Recommended max width 400px
- All images will be automatically resized to fit containers
- Use PNG format for screenshots with UI elements
- Use JPG for photographic content

### Quality Guidelines
- High resolution for clarity
- Clear, readable text in screenshots
- Consistent styling with the application theme
- Highlight important UI elements when necessary

## Implementation Notes

The system automatically:
- Detects device type (mobile vs desktop)
- Shows appropriate images based on device
- Falls back to placeholder.svg if images are missing
- Handles multiple images per question with step indicators
- Normalizes image sizes with CSS constraints
