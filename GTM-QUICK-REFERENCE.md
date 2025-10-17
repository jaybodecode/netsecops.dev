# GTM Quick Reference: RSS UTM Tracking
## Visual Checklist & Screenshots Guide

---

## 🎯 Your Goal

Get RSS feed clicks tracked in Google Analytics 4 with UTM parameters:
- **Source:** `rss`
- **Medium:** `feed`  
- **Campaign:** `all_publications`, `all_articles`, or category name

---

## ✅ Quick Checklist (3 Things)

### 1. GA4 Configuration Tag ✓

**What to look for in GTM:**

```
┌─────────────────────────────────────────────────┐
│ Tag Name: GA4 Configuration                     │
├─────────────────────────────────────────────────┤
│ Tag Type: Google Analytics: GA4 Configuration   │
│                                                  │
│ ⚙️ Configuration:                               │
│   Measurement ID: G-XXXXXXXXXX ← COPY FROM GA4  │
│                                                  │
│ 🎯 Triggering:                                  │
│   ✓ Initialization - All Pages                 │
│     (or "All Pages")                            │
└─────────────────────────────────────────────────┘
```

**Where to find your Measurement ID:**
1. Open GA4 → Admin → Data Streams
2. Click your website stream
3. Copy **G-XXXXXXXXXX**

---

### 2. GA4 Page View Tag ✓

**What to look for in GTM:**

```
┌─────────────────────────────────────────────────┐
│ Tag Name: GA4 - Page View                       │
├─────────────────────────────────────────────────┤
│ Tag Type: Google Analytics: GA4 Event           │
│                                                  │
│ ⚙️ Configuration:                               │
│   Configuration Tag: → GA4 Configuration        │
│   Event Name: page_view                         │
│                                                  │
│ 🎯 Triggering:                                  │
│   ✓ All Pages                                   │
└─────────────────────────────────────────────────┘
```

**Alternative:** Configuration tag might have this checkbox:
```
☑️ Send a page view event when this configuration loads
```

---

### 3. Published Container ✓

**Make sure your changes are live:**

```
┌─────────────────────────────────────────────────┐
│ GTM Container: GTM-XXXXXXX                      │
├─────────────────────────────────────────────────┤
│ Workspace: Default Workspace                    │
│                                                  │
│ ✅ Latest changes published                     │
│                                                  │
│ [Submit] ← Click to publish if not done         │
└─────────────────────────────────────────────────┘
```

**CRITICAL:** Changes are NOT live until you click "Submit" → "Publish"!

---

## 🧪 Testing: GTM Preview Mode

### Step-by-Step Visual Guide

**1. Start Preview Mode**
```
GTM Dashboard → [Preview] button (top right)
                    ↓
Enter URL: https://cyber.netsecops.io
                    ↓
            [Connect] button
```

**2. What You'll See**
```
┌─────────────────────────────────────────────────┐
│ 🐛 Tag Manager Debugger                         │
├─────────────────────────────────────────────────┤
│ Summary                                          │
│                                                  │
│ Container Loaded ← Should see this first        │
│                                                  │
│ Tags Fired: 2                                    │
│   ✅ GA4 Configuration                          │
│   ✅ GA4 - Page View                            │
│                                                  │
│ Tags Not Fired: 0 ← Should be 0                │
└─────────────────────────────────────────────────┘
```

**3. Test UTM Parameters**
```
In browser address bar, go to:
https://cyber.netsecops.io/?utm_source=rss&utm_medium=feed&utm_campaign=test

Check GTM Debugger:
┌─────────────────────────────────────────────────┐
│ Event: Page View                                 │
├─────────────────────────────────────────────────┤
│ Data Layer:                                      │
│   gtm.url: https://cyber.netsecops.io/?utm...  │
│   utm_source: "rss"      ✅                     │
│   utm_medium: "feed"     ✅                     │
│   utm_campaign: "test"   ✅                     │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Testing: GA4 DebugView

### Real-Time Event Verification

**1. Open DebugView**
```
GA4 Dashboard → Configure (left sidebar) → DebugView
```

**2. What to Look For**
```
┌─────────────────────────────────────────────────┐
│ Events Stream (last 30 minutes)                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  ● page_view ← Click on this event             │
│    ↓                                            │
│    Event Parameters:                            │
│      page_location: https://cyber...?utm_...    │
│      session_source: rss         ✅             │
│      session_medium: feed        ✅             │
│      session_campaign: test      ✅             │
│                                                  │
└─────────────────────────────────────────────────┘
```

**If you see UTM parameters ✅ - It's working!**

---

## 📊 After 24-48 Hours: Check GA4 Reports

### Traffic Acquisition Report

**Where to find it:**
```
GA4 → Reports → Acquisition → Traffic acquisition
```

**What you'll see:**
```
┌──────────────────────────────────────────────────────────────┐
│ Session source / medium          Sessions    Engaged sessions │
├──────────────────────────────────────────────────────────────┤
│ rss / feed                       42          38               │
│   ↓ Click to expand campaigns                                 │
│   ├─ all_articles                25          23               │
│   ├─ all_publications            10          9                │
│   ├─ data-breach                 4           3                │
│   └─ ransomware                  3           3                │
│                                                                │
│ google / organic                 156         142              │
│ (direct) / (none)                89          76               │
└──────────────────────────────────────────────────────────────┘
```

**This means:**
- 42 users came from RSS feeds
- 25 from "All Articles" feed
- 10 from "All Publications" feed
- 7 from category feeds

---

## 🚨 Common Problems & Quick Fixes

### Problem: "Tags not firing in Preview Mode"

**Visual Check:**
```
❌ Bad:
┌─────────────────────────────────┐
│ Tags Fired: 0                   │
│ Tags Not Fired: 2               │
│   GA4 Configuration             │
│   GA4 - Page View               │
└─────────────────────────────────┘

✅ Good:
┌─────────────────────────────────┐
│ Tags Fired: 2                   │
│   ✓ GA4 Configuration          │
│   ✓ GA4 - Page View            │
└─────────────────────────────────┘
```

**Fix:**
1. Check tag **Triggering** = "All Pages"
2. Check tag is **not paused** (should be blue/green, not gray)
3. Disable ad blockers
4. Try incognito/private mode

---

### Problem: "No UTM parameters showing"

**Visual Check in Data Layer:**
```
❌ Bad:
┌─────────────────────────────────┐
│ Data Layer:                     │
│   gtm.url: https://cyber...     │
│   (no utm_ parameters)          │
└─────────────────────────────────┘

✅ Good:
┌─────────────────────────────────┐
│ Data Layer:                     │
│   gtm.url: https://cyber...?utm │
│   utm_source: "rss"             │
│   utm_medium: "feed"            │
│   utm_campaign: "all_articles"  │
└─────────────────────────────────┘
```

**Fix:**
1. Check browser address bar - UTM must be in URL
2. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache
4. Test with this URL:
   ```
   https://cyber.netsecops.io/?utm_source=rss&utm_medium=feed&utm_campaign=test
   ```

---

### Problem: "Wrong Measurement ID"

**Visual Check:**
```
❌ Mismatch:
GTM Tag Measurement ID:  G-ABC1234567
GA4 Property ID:         G-XYZ9876543
                         ⬆ DIFFERENT!

✅ Match:
GTM Tag Measurement ID:  G-ABC1234567
GA4 Property ID:         G-ABC1234567
                         ⬆ SAME!
```

**Fix:**
1. Open GA4 → Admin → Data Streams → Your stream
2. Copy **Measurement ID** (G-XXXXXXXXXX)
3. Paste into GTM tag
4. Save tag
5. **Publish** GTM container
6. Wait 5-10 minutes

---

## 🎓 GTM Tag Status Icons

### Understanding Tag States

```
🟢 Green checkmark ✅ = Tag fired successfully
🔵 Blue dot ● = Tag ready to fire
⚫ Gray = Tag paused/disabled
🔴 Red X ❌ = Tag error/failed to fire
🟡 Yellow ! = Tag warning
```

### Tag Firing Sequence

```
Page Load
    ↓
Container Loaded (Event)
    ↓
🟢 GA4 Configuration (fires first)
    ↓
🟢 GA4 Page View (fires second)
    ↓
Data sent to GA4 ✅
```

---

## 📋 Pre-Deployment Checklist

Before deploying your RSS feeds, verify GTM setup:

```
☐ GTM snippet in website <head>
☐ GTM noscript in website <body>
☐ GA4 Configuration tag exists
☐ Measurement ID correct (G-XXXXXXXXXX)
☐ GA4 Page View tag exists OR config sends page views
☐ Both tags trigger on "All Pages"
☐ Preview Mode shows tags firing
☐ DebugView shows events with UTM params
☐ GTM container published (not just saved)
☐ Waited 10 minutes after publishing
```

---

## 🔗 Quick Links

### Google Tag Manager
- **Dashboard:** https://tagmanager.google.com
- **Help:** https://support.google.com/tagmanager

### Google Analytics 4
- **Dashboard:** https://analytics.google.com
- **DebugView:** GA4 → Configure → DebugView
- **Reports:** GA4 → Reports → Acquisition → Traffic acquisition

### Testing Tools
- **Tag Assistant:** [Chrome Extension](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
- **GA Debugger:** [Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

---

## 💡 Key Takeaways

### What GTM Does Automatically ✨

When a user clicks an RSS feed link with UTM parameters:

```
RSS Reader
    ↓
User clicks article link
    ↓
Link: https://cyber.netsecops.io/articles/abc?utm_source=rss&utm_medium=feed&utm_campaign=all_articles
    ↓
Browser loads page
    ↓
GTM fires (automatically)
    ↓
GA4 Configuration loads
    ↓
Page View event sent to GA4
    ↓
GA4 automatically extracts UTM from URL ✅
    ↓
Session attributed to:
  - Source: rss
  - Medium: feed
  - Campaign: all_articles
```

**You don't need to:**
- ❌ Create custom variables for UTM parameters
- ❌ Create special triggers
- ❌ Write JavaScript code
- ❌ Configure data layer pushes

**GA4 does it all automatically!** 🎉

---

## 🎯 Success Criteria

### You'll know it's working when:

**Immediately (in Preview Mode):**
- ✅ GA4 tags fire on page load
- ✅ UTM parameters visible in Data Layer
- ✅ No errors in GTM debugger

**Within 1-5 minutes (in DebugView):**
- ✅ `page_view` events appear
- ✅ Event parameters show UTM values
- ✅ Session attributes show `rss / feed`

**After 24-48 hours (in Reports):**
- ✅ Traffic acquisition shows `rss / feed` source
- ✅ Multiple campaigns visible (all_articles, data-breach, etc.)
- ✅ Sessions, users, engagement metrics tracked
- ✅ Can see which articles got most RSS clicks

---

## 📞 Need More Help?

### Step-by-Step Documentation
- **Full Guide:** `GTM-VERIFICATION-GUIDE.md`
- **GA4 Setup:** `GOOGLE-ANALYTICS-RSS-SETUP.md`
- **RSS System:** `RSS-SYSTEM-DOCUMENTATION.md`

### Detailed Troubleshooting
See full guides above for:
- Creating tags from scratch
- Advanced testing procedures
- Custom event tracking
- GA4 report configuration
- Common error solutions

---

**Remember:** The hard part is done! ✅  
RSS feeds already have UTM parameters.  
You just need to verify GTM is set up correctly.

**Time needed:** 10-15 minutes to verify setup  
**Complexity:** Low - just checking 3 things!

Good luck! 🚀
