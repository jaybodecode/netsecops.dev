# Icon Usage Guide

## Overview

This project uses **Heroicons** and other icon libraries via `@nuxt/icon` for a professional, consistent cyberpunk aesthetic. All emojis have been replaced with vector icons.

## Icon Library

**Primary:** Heroicons (via `@nuxt/icon`)
- Clean, modern design
- Perfect for cyberpunk theme
- Fully customizable (size, color)
- No emoji inconsistencies across platforms

## Icon Mapping

### Previous Emojis → Current Icons

| Previous | Icon | Usage |
|----------|------|-------|
| 🛡️ | `heroicons:shield-check-20-solid` | Brand logo, site title, DEFCON 4 |
| ⚠️ | `heroicons:shield-exclamation-20-solid` | Threat level, warnings, DEFCON 2 |
| 🚨 | `heroicons:shield-exclamation-20-solid` | Critical alerts, DEFCON 1 |
| ⚡ | `heroicons:bolt-20-solid` | Power, speed, DEFCON 3 |
| 🐦 | `ri:twitter-x-fill` | Twitter/X social link |
| 💼 | `mdi:linkedin` | LinkedIn social link |
| 🔵 (GitHub) | `mdi:github` | GitHub social link |
| ✅ | `heroicons:check-circle-20-solid` | Success, DEFCON 5 |

### DEFCON Level Icons

| Level | Icon | Color | Description |
|-------|------|-------|-------------|
| DEFCON 1 | `heroicons:shield-exclamation-20-solid` | Red | Maximum readiness |
| DEFCON 2 | `heroicons:exclamation-triangle-20-solid` | Orange | High alert |
| DEFCON 3 | `heroicons:bolt-20-solid` | Yellow | Increased readiness |
| DEFCON 4 | `heroicons:shield-check-20-solid` | Cyan | Normal readiness |
| DEFCON 5 | `heroicons:check-circle-20-solid` | Green | Lowest alert |

## Usage Examples

### Basic Icon
```vue
<Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 text-cyan-400" />
```

### With Animation
```vue
<Icon 
  name="heroicons:bolt-20-solid" 
  class="w-8 h-8 text-yellow-400" 
  style="animation: pulse 2s infinite;"
/>
```

### With Drop Shadow (Glow Effect)
```vue
<Icon 
  name="heroicons:shield-check-20-solid" 
  class="w-10 h-10 text-cyan-400"
  style="filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));"
/>
```

### Dynamic Icon
```vue
<Icon 
  :name="defconDisplay.icon" 
  :class="['w-6 h-6', defconDisplay.color]" 
/>
```

## Available Icon Collections

Via `@nuxt/icon`, you have access to:

- **Heroicons** (`heroicons:`)
- **Material Design Icons** (`mdi:`)
- **Remix Icon** (`ri:`)
- **Lucide** (`lucide:`)
- **Font Awesome** (`fa:`, `fa6-solid:`, etc.)
- **And 100+ more collections**

### Finding Icons

**Browse icons:**
- Heroicons: https://heroicons.com/
- Iconify: https://icon-sets.iconify.design/
- Material Design: https://pictogrammers.com/library/mdi/

## Component Updates

### Files Updated
1. ✅ `components/CyberHeader.vue` - Added icon prop, removed emoji from title
2. ✅ `components/CyberFooter.vue` - Social links now use icons
3. ✅ `components/CyberThreatLevel.vue` - Warning icon instead of emoji
4. ✅ `pages/index.vue` - Added icon to header
5. ✅ `types/site-config.ts` - DefconDisplay uses `icon` field instead of `emoji`

### Type Changes
```typescript
// Before
interface DefconDisplay {
  emoji: string;  // ❌
}

// After
interface DefconDisplay {
  icon: string;  // ✅
}
```

## Best Practices

### DO ✅
- Use Heroicons for primary UI elements
- Set consistent sizes: `w-4 h-4`, `w-6 h-6`, `w-8 h-8`
- Apply color classes: `text-cyan-400`, `text-purple-500`
- Use drop-shadow for glow effects
- Keep icon style consistent across the site

### DON'T ❌
- Mix emojis with icons
- Use too many different icon libraries
- Forget to specify size (icons default to font size)
- Use inline SVGs when icon libraries are available

## Icon Sizes Reference

| Size | Classes | Usage |
|------|---------|-------|
| Small | `w-4 h-4` | Inline text, badges |
| Medium | `w-6 h-6` | Standard buttons, links |
| Large | `w-8 h-8` | Headers, emphasis |
| XL | `w-10 h-10` or `w-12 h-12` | Hero sections, branding |

## Cyberpunk Color Palette

Match icons to theme colors:

| Color | Class | Hex | Usage |
|-------|-------|-----|-------|
| Cyan | `text-cyan-400` | `#22d3ee` | Primary, links |
| Purple | `text-purple-400` | `#c084fc` | Secondary, accents |
| Pink | `text-pink-400` | `#f472b6` | Tertiary, highlights |
| Green | `text-green-400` | `#4ade80` | Success, safe |
| Yellow | `text-yellow-400` | `#facc15` | Warning, attention |
| Orange | `text-orange-400` | `#fb923c` | Alert, caution |
| Red | `text-red-400` | `#f87171` | Critical, danger |

## Performance

Icons from `@nuxt/icon` are:
- ✅ Optimized SVGs
- ✅ Tree-shaken (only used icons bundled)
- ✅ Cached by browser
- ✅ No external requests needed
- ✅ Smaller than emoji fonts

## Future Enhancements

Consider adding:
1. Custom icon animations (spin, pulse, glow)
2. Animated icon transitions between states
3. Icon badges/overlays for notifications
4. Custom SVG icons for brand-specific elements

---

**Last Updated:** October 10, 2025
**Status:** ✅ All emojis replaced with icons
