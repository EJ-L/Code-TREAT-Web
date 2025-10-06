# User Guide Page - Drill-Down Navigation

## Overview
The User Guide page has been completely refactored with a clean, intuitive drill-down navigation system that shows only relevant content at each level.

## Navigation Structure

### Level 1: Main Sections
**What users see:** Two large cards with icons
- **Leaderboard** (Chart icon)
- **Additional** (Settings icon)

Each card is clickable and takes the user to the next level.

### Level 2: Subsections
**What users see:** List of subsections within the selected main section

For **Leaderboard**:
- Filtering (with Chart icon)
- Chart View (with Presentation Chart icon)
- Table View (with Table icon)
- Compare (with Arrows icon)
- Exporting (with Download icon)

For **Additional**:
- Sidebar (with Bars icon)

Each subsection shows:
- Icon
- Title
- Number of available guides

### Level 3: Questions List
**What users see:** List of all questions within the selected subsection

Each question is displayed as a clickable card showing:
- Question text
- Chevron right icon to indicate it's clickable

### Level 4: Question Detail
**What users see:** Full content for the selected question

Displays:
- **Question Title** (highlighted in blue box)
- **Steps Section** (numbered steps with clear formatting)
- **Screenshot Section** (with device-specific image)
  - Shows PC screenshots on desktop
  - Shows mobile screenshots on mobile devices
  - Falls back to placeholder if image missing

## Key Features

### 1. Back Button
- Appears at all levels except Level 1
- Allows users to go back one level
- Styled with hover and tap animations
- Always visible at the top of the content

### 2. Breadcrumb Navigation
- Shows current path (e.g., "Leaderboard / Filtering / How to filter using the time range")
- Updates automatically as user navigates
- Helps users understand their current location

### 3. State Management
- **Automatic Reset**: When users navigate away from the User Guide page and return, the state automatically resets to Level 1
- **Component Remount**: Uses React's key prop to force component remount on navigation changes

### 4. Smooth Animations
- Page transitions with slide effects
- Back button fade-in/out
- Card hover states with scale animations
- All animations use Framer Motion for smooth performance

### 5. Responsive Design
- **Desktop**: Large, spacious cards optimized for mouse interaction
- **Mobile**: Touch-friendly buttons with appropriate sizing
- **Screenshots**: Automatically shows device-appropriate images

## User Experience Flow

```
User clicks "User Guide" in sidebar
  ↓
Sees "Leaderboard" and "Additional" cards (Level 1)
  ↓
Clicks "Leaderboard"
  ↓
Sees list of subsections: Filtering, Chart View, Table View, etc. (Level 2)
  ↓
Clicks "Filtering"
  ↓
Sees list of questions about filtering (Level 3)
  ↓
Clicks "How to filter using the time range"
  ↓
Sees complete guide with steps and screenshots (Level 4)
  ↓
Can click "Back" to return to previous level
or use breadcrumb to understand location
```

## Benefits of This Approach

### 1. Clean Interface
- No clutter - only shows relevant content
- No nested accordions or expanding sections
- Full screen space for current level

### 2. Clear Navigation
- Back button is always accessible
- Breadcrumb shows current path
- Each level has clear purpose

### 3. Better Focus
- Users focus on one thing at a time
- Steps and screenshots get full attention
- No distractions from other sections

### 4. Mobile-Friendly
- Touch targets are large and clear
- No need for nested scrolling
- Natural swipe-like navigation flow

### 5. Maintainable
- Easy to add new sections/questions
- Data-driven structure
- Icons can be easily customized

## Implementation Details

### Component Structure
```
GuidelinePage
├── GuidelineHero (title and description)
└── GuidelineContent (main navigation logic)
    ├── renderSections() - Level 1
    ├── renderSubsections() - Level 2
    ├── renderQuestions() - Level 3
    └── renderDetail() - Level 4
```

### State Variables
- `currentLevel`: Tracks which level user is on
- `selectedSection`: Stores selected main section
- `selectedSubsection`: Stores selected subsection
- `selectedItem`: Stores selected question
- `isMobile`: Detects if user is on mobile device

### Navigation Functions
- `handleSectionClick()`: Goes to Level 2
- `handleSubsectionClick()`: Goes to Level 3
- `handleQuestionClick()`: Goes to Level 4
- `handleBack()`: Goes back one level

## Future Enhancements
- Add search functionality across all questions
- Add "Recently Viewed" section
- Add keyboard navigation (Arrow keys, Escape)
- Add direct links to specific questions
- Add "Next" and "Previous" buttons in Level 4

## Testing Checklist
- [x] Navigation works correctly through all 4 levels
- [x] Back button works at each level
- [x] Breadcrumb displays correctly
- [x] State resets when navigating away and back
- [x] Dark/Light mode styling correct
- [x] Mobile responsive layout
- [x] Desktop layout with hover states
- [x] Animations smooth and performant
- [x] Icons display correctly
- [x] Device-specific screenshots work
- [x] Placeholder image fallback works
- [x] Build succeeds without errors

