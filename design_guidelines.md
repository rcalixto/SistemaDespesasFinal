# Design Guidelines: Sistema de Gestão de Despesas ABERT

## Design Approach

**System Selected:** Shadcn UI (Radix UI Primitives) - Already implemented in existing codebase
**Rationale:** This is a utility-focused corporate application requiring efficiency, data clarity, and consistent component patterns. The existing implementation with Shadcn UI provides an excellent foundation for a professional enterprise system.

## Core Design Principles

1. **Information Clarity**: Dense data presentation with clear visual hierarchy
2. **Workflow Efficiency**: Streamlined forms and approval processes
3. **Status Transparency**: Immediate visual feedback on request states
4. **Corporate Professionalism**: Trust-building, authoritative interface
5. **Responsive Density**: Adapt information density across devices without losing context

## Typography System

**Primary Font:** Inter (via Google Fonts)
**Secondary Font:** System UI fallback

**Hierarchy:**
- Page Headers: 2xl-4xl, font-bold (32-36px)
- Section Titles: xl-2xl, font-semibold (20-24px)
- Card Headers: lg, font-medium (18px)
- Body Text: base, font-normal (16px)
- Labels/Metadata: sm-xs, font-medium (14-12px)
- Table Data: sm, font-normal (14px)

**Color References:**
- Headers: Primary brand color (abert-blue as seen in code)
- Body: Neutral dark (abert-gray80)
- Metadata: Neutral medium (abert-gray60)

## Layout System

**Spacing Units:** Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Component padding: p-4 to p-6
- Section spacing: mb-6 to mb-8
- Grid gaps: gap-4 to gap-6
- Form field spacing: space-y-4

**Grid Patterns:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-4
- Data lists: Single column, full width with internal grid structure
- Forms: Single column (max-w-2xl) with occasional 2-column splits for paired fields
- Filters: Horizontal layout wrapping responsively

**Container Strategy:**
- Main content: max-w-7xl mx-auto with px-6
- Forms/Dialogs: max-w-2xl
- Full-width tables/lists with internal constraints

## Component Library

### Navigation & Structure
- **Sidebar Navigation**: Fixed left sidebar (240-280px) with collapsible mobile drawer
- **Top Bar**: User profile, notifications, global actions
- **Breadcrumbs**: Always visible for deep navigation context
- **Tabs**: For switching between related views (e.g., pending vs. approved)

### Data Display
- **Cards**: Primary container with subtle shadow, border-l-4 accent for status/category
- **Tables**: Compact rows, alternating subtle background, sticky headers for long lists
- **Status Badges**: Rounded-full badges with status-specific background colors, inline with content
- **Metric Cards**: Large numbers (3xl font-bold) with supporting metadata, icon in corner
- **Lists**: Card-based with internal grid for metadata, expandable details

### Forms & Input
- **Form Groups**: Vertical stacking with consistent label positioning above inputs
- **Input Fields**: Full width within containers, clear focus states (border accent)
- **File Upload**: Drag-and-drop zones with preview thumbnails
- **Date Pickers**: Integrated calendar popovers
- **Select Dropdowns**: Searchable with clear selected state
- **Action Buttons**: Primary (solid), Secondary (outline), Tertiary (ghost)

### Feedback & Overlays
- **Toasts**: Top-right position (as implemented with Sonner)
- **Dialogs**: Center-screen with overlay, scrollable content for long forms
- **Loading States**: Subtle spinners, skeleton screens for data-heavy sections
- **Empty States**: Centered messaging with optional CTA

### Workflow Indicators
- **Status Timeline**: Horizontal progress indicator showing approval stages
- **Approval Actions**: Clear Accept/Reject buttons with confirmation dialogs
- **Request Cards**: Border-left color coding by status, prominent amount display

## Visual Patterns

### Dashboard Layouts
- **Summary Row**: 3-4 metric cards with icons, counts, and totals
- **Filter Bar**: Sticky below header with collapsible advanced options
- **Content Grid**: Cards or table below filters, paginated for large datasets
- **Multi-Dashboard Views**: Tab navigation between user/director/financial perspectives

### Form Workflows
- **Progressive Disclosure**: Show additional fields based on selections
- **Inline Validation**: Real-time feedback on field completion
- **Attachment Handling**: Clear list of uploaded files with remove option
- **Submit Confirmation**: Summary review before final submission

### Status Visualization
Define distinct visual treatments per status:
- Pending/Solicitado: Neutral with yellow accent
- Approved: Success green
- Paid: Completion blue
- Rejected: Alert red
- In Progress: Active orange

### Data Density
- **Compact Mode**: Default for experienced users, showing maximum information
- **Card Expansion**: Click/hover to reveal full details without navigation
- **Collapsible Sections**: For forms with many optional fields
- **Smart Truncation**: Show key info, expand on demand

## Responsive Behavior

**Breakpoints:**
- Mobile (base): Single column, stacked cards, simplified tables
- Tablet (md: 768px): 2-column grids, full tables with horizontal scroll
- Desktop (lg: 1024px): 3-4 column grids, full data density
- Wide (xl: 1280px): Maximum grid utilization

**Mobile Adaptations:**
- Sidebar → Bottom navigation or hamburger menu
- Multi-column grids → Single column
- Tables → Card-based list views with key data visible
- Filters → Drawer/modal interface

## Animations

**Minimal, Purposeful Only:**
- Page transitions: None
- Component entry: Subtle fade (100ms)
- Hover states: Border/background shift (150ms)
- Loading: Spinner or skeleton screen
- Status changes: Brief highlight flash to draw attention

## Accessibility

- Clear focus indicators (2px solid outline with offset)
- Sufficient contrast ratios (WCAG AA minimum)
- Keyboard navigation for all actions
- Screen reader labels for status badges and icons
- Form error messages linked to fields

## Images

**No hero images required.** This is a corporate dashboard application.

**Icon Usage:**
- Lucide React icons throughout (already in dependencies)
- Navigation: Consistent icon set per section
- Status indicators: Check, X, Clock, Alert icons
- Actions: Plus, Edit, Trash, Download, Upload icons
- Financial: Currency, Chart, Calendar icons

**Avatar/Profile:**
- User initials or uploaded photo in top-right
- Small circular thumbnails in approval workflows

This design system prioritizes functionality, clarity, and efficiency for a professional corporate environment where users need to quickly process requests, track expenses, and make approval decisions.