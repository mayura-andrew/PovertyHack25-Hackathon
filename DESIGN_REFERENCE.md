# 🎨 Quick Visual Reference - Google Material Design

## Color Palette

### Stage Colors
```
🟡 Qualifications  → #f59e0b (Amber 500)
🟢 Foundation      → #10b981 (Green 500)  
🔵 Degrees         → #2563eb (Blue 600)
🟣 Careers         → #7c3aed (Purple 600)
```

### Neutral Colors
```
⚪ White          → #ffffff
🔲 Gray 50        → #f9fafb
🔲 Gray 100       → #f3f4f6
🔲 Gray 200       → #e5e7eb
🔲 Gray 400       → #9ca3af
🔲 Gray 600       → #4b5563
🔲 Gray 700       → #374151
🔲 Gray 900       → #111827
```

---

## Node Card Anatomy

```
┌────────────────────────────────────┐
│ ████████████████████████████████  │ ← Colored top accent (4px)
│                                    │
│  📘 Bachelor of Software Eng.     │ ← Title (16px, semibold)
│                                    │
│  [🎓 Bachelor's Degree]           │ ← Badge (colored background)
│                                    │
│  🏛️  The Open University of...    │ ← Institute (12px)
│  ✓  Electrical & Computer Eng.    │ ← Department (12px)
│  ⏱️  4 years                       │ ← Duration (12px)
│  💼 Software Engineer, QA...      │ ← Careers (12px, blue)
│                                    │
│  ┌─ Entry Requirements ─────────┐ │
│  │ • O/L Pass                    │ │
│  │ • Advanced Certificate        │ │
│  └───────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
   ↑                              ↑
   Border: Colored 2px          Shadow: Subtle
```

---

## Button Styles

### Primary (Filled)
```tsx
bg-blue-600 text-white
hover:bg-blue-700
rounded-lg shadow-sm
```
**Use for**: Main actions (Show All)

### Secondary (Outlined)
```tsx
border border-gray-300 text-gray-700
hover:bg-gray-50
rounded-lg
```
**Use for**: Secondary actions (Animate, Back)

---

## Spacing Scale (8px grid)

```
gap-1   → 4px   (tight)
gap-2   → 8px   (compact)
gap-2.5 → 10px  (default icons)
gap-3   → 12px  (comfortable)
gap-4   → 16px  (spacious)
gap-6   → 24px  (section)
```

---

## Shadow Scale

```
shadow-sm  → Subtle (header, default cards)
shadow-md  → Standard (cards at rest)
shadow-lg  → Elevated (legend, modals)
shadow-xl  → Hover state (interactive cards)
```

---

## Typography Scale

```
text-xs   → 12px  (body, details)
text-sm   → 14px  (labels, descriptions)
text-base → 16px  (card titles)
text-lg   → 18px  (section headings)
text-xl   → 20px  (subsection)
text-2xl  → 24px  (page title)
```

### Font Weights
```
font-normal   → 400 (body text)
font-medium   → 500 (emphasis)
font-semibold → 600 (headings)
font-bold     → 700 (rarely used)
```

---

## Rounded Corners

```
rounded-lg  → 8px   (buttons, small cards)
rounded-xl  → 12px  (main cards, containers)
rounded-2xl → 16px  (sections, large areas)
rounded-full → 999px (badges, pills)
```

---

## Icon Sizes

```
w-3 h-3 → 12px (small badges)
w-4 h-4 → 16px (body text icons)
w-5 h-5 → 20px (buttons, headers)
```

---

## Edge/Arrow Styles

### Qualification → Foundation
```
Color: #10b981 (Green)
Width: 2.5px
Arrow: 20x20px
Style: Solid, animated
```

### Foundation → Degree
```
Color: #2563eb (Blue)
Width: 2.5px
Arrow: 20x20px
Style: Solid, animated
```

### Degree → Career
```
Color: #7c3aed (Purple)
Width: 3px
Arrow: 22x22px
Style: Solid, animated
```

---

## Component Hierarchy

```
1. Page Background     → bg-gray-50
2. Header              → bg-white + border-b
3. Canvas              → bg-gray-50 + grid
4. Cards (nodes)       → bg-white + border + shadow
5. Elevated (hover)    → shadow-xl + translate-y-1
6. Modals/Legend       → bg-white + shadow-lg
```

---

## Interactive States

### Hover
```tsx
// Cards
hover:-translate-y-1      // Lift 4px
hover:shadow-xl           // Deeper shadow
hover:border-{color}-300  // Darker border

// Buttons  
hover:bg-gray-50          // Subtle highlight
hover:bg-blue-700         // Darker primary
```

### Focus
```tsx
focus:outline-none
focus:ring-2
focus:ring-blue-500
focus:ring-offset-2
```

### Active
```tsx
active:scale-95  // Slight press effect
```

---

## Badge Styles

### Qualification (Amber)
```tsx
bg-amber-50 text-amber-700 border-amber-200
```

### Foundation (Green)
```tsx
bg-green-50 text-green-700 border-green-200
```

### Degree (Blue)
```tsx
bg-blue-50 text-blue-700 border-blue-200
```

### Career (Purple)
```tsx
bg-purple-50 text-purple-700 border-purple-200
```

---

## Animation Durations

```
duration-200 → 200ms  (quick interactions)
duration-300 → 300ms  (standard)
duration-500 → 500ms  (deliberate)
duration-800 → 800ms  (attention-grabbing)
```

---

## Layout Grid

### Spacing Between Nodes
```
X-axis: 380px  (card width + margin)
Y-axis: 250px  (card height + margin)
```

### Node Dimensions
```
Min Width:  320px
Max Width:  360px
Padding:    20px (p-5)
```

---

## Accessibility

### Contrast Ratios (WCAG AA)
```
✅ Gray 900 on White   → 19:1 (AAA)
✅ Gray 700 on White   → 10:1 (AAA)
✅ Blue 700 on Blue 50 → 8:1  (AAA)
✅ Blue 600 (primary)  → 4.5:1 (AA)
```

### Interactive Elements
```
Min touch target: 44x44px
Keyboard accessible: ✅
Focus visible: ✅
Screen reader labels: ✅
```

---

## Quick Copy-Paste

### Clean White Card
```tsx
className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5 hover:shadow-xl transition-all duration-200"
```

### Primary Button
```tsx
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
```

### Secondary Button
```tsx
className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
```

### Badge
```tsx
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200"
```

### Legend Item
```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
  <span className="text-xs text-gray-600">Label</span>
</div>
```

---

**Design System**: Google Material Design 3
**Framework**: Tailwind CSS
**Theme**: Clean & Professional
**Status**: ✅ Ready to Use
