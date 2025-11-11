# Auto Layout & Per-Side Padding Implementation

## Overview
This document describes the re-implementation of the Auto Layout UI and per-side padding functionality for frames in the Wireframe Editor.

## Changes Made

### 1. Auto Layout UI - Dropdown to Buttons
**Location:** `src/components/WireframeEditor.tsx` (Frame properties panel)

**Before:** Single dropdown select with three options (None, Horizontal, Vertical)
```tsx
<Select value={selectedElementData.layoutMode || 'none'}>
  <SelectItem value="none">None</SelectItem>
  <SelectItem value="horizontal">Horizontal</SelectItem>
  <SelectItem value="vertical">Vertical</SelectItem>
</Select>
```

**After:** Three inline icon buttons
- **Button 1 (Layers icon):** Toggle Auto Layout on/off
  - Click to activate/deactivate layout mode
  - When enabled, defaults to 'horizontal' mode
- **Button 2 (Horizontal arrows):** Set horizontal layout
  - Arranges children left-to-right
  - Mutually exclusive with vertical
- **Button 3 (Vertical arrows):** Set vertical layout
  - Arranges children top-to-bottom
  - Mutually exclusive with horizontal

**Behavior:** Only one axis can be active. Buttons show 'default' variant when active, 'outline' when inactive.

### 2. Padding Picker Component
**Location:** `src/components/PaddingPicker.tsx` (Already exists)

**Features:**
- Toggle between uniform padding and individual side padding
- When linked (uniform): Single input for all sides
- When unlinked (individual): 4 separate inputs for Top, Right, Bottom, Left
- Fallback to legacy `padding` property for backward compatibility
- PT (Portuguese labels): "Todos os lados", "Superior", "Direito", "Inferior", "Esquerdo"

**Integration:** Used in Frame properties when layout mode is active (horizontal or vertical)

### 3. Per-Side Padding in Layout Calculations

#### Data Structure (`src/types.ts`)
```typescript
interface WireframeElement {
  padding?: number;              // Legacy property
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // ... rest of properties
}
```

#### Helper Function
```typescript
const getPaddingVals = (element: WireframeElement) => {
  const base = element.padding ?? 0;
  return {
    top: element.paddingTop ?? base,
    right: element.paddingRight ?? base,
    bottom: element.paddingBottom ?? base,
    left: element.paddingLeft ?? base,
  };
};
```

#### Updated Functions

1. **fillContainer(elementId, axis)**
   - Respects per-side padding when filling horizontally or vertically
   - Uses left/right for horizontal axis, top/bottom for vertical
   - Accounts for border width (Konva stroke is centered)
   - Fallback: Uses legacy `padding` if per-side values are not set

2. **hugContents(frameId, axis)**
   - Uses `getPaddingVals()` to get per-side padding
   - Adjusts frame dimensions based on individual padding values
   - Repositions children accordingly

3. **updateFrameLayout(frameId, axis)**
   - Uses per-side padding to position children
   - `currentX` starts at `p.left`, `currentY` at `p.top`
   - Frame dimensions calculated using `p.left + p.right` and `p.top + p.bottom`

### 4. Import Changes
- Added `import { PaddingPicker } from './PaddingPicker';` to WireframeEditor.tsx

## Backward Compatibility
All changes are backward compatible:
- Legacy `padding` property still works
- Per-side padding values fall back to `padding` if not explicitly set
- Existing frames continue to work with their existing `padding` value

## Testing Checklist

- [ ] Select a frame element in the wireframe editor
- [ ] Verify Auto Layout buttons appear (Layers, Horizontal, Vertical)
- [ ] Click Layers button to toggle Auto Layout on/off
- [ ] Click Horizontal button - should enable horizontal layout and show children left-to-right
- [ ] Click Vertical button - should enable vertical layout and show children top-to-bottom
- [ ] Verify PaddingPicker appears when layout is active
- [ ] Test linked padding mode (single input for all sides)
- [ ] Test unlinked padding mode (4 individual inputs)
- [ ] Set different padding values (e.g., Top=16, Right=8, Bottom=12, Left=4)
- [ ] Verify children reflow according to per-side padding
- [ ] Test with frames that have `borderWidth` - verify proper positioning
- [ ] Test Fill Horizontally / Vertically with per-side padding
- [ ] Test Hug Horizontally / Vertically with per-side padding

## Files Modified
1. `src/components/WireframeEditor.tsx`
   - Added PaddingPicker import
   - Added getPaddingVals() helper function
   - Updated Auto Layout UI (dropdown → buttons)
   - Updated fillContainer() for per-side padding
   - Updated hugContents() for per-side padding
   - Updated updateFrameLayout() for per-side padding
   - Replaced padding Input with PaddingPicker component

2. `src/types.ts` (Already had these properties)
   - paddingTop, paddingRight, paddingBottom, paddingLeft fields

3. `src/components/PaddingPicker.tsx` (Already exists)
   - Used as-is, no modifications needed

## Future Enhancements
- Add visual "padding knob" UI (similar to Figma/design tools)
- Add keyboard shortcuts for layout modes
- Persist layout preferences per project
- Add layout animation/transition
