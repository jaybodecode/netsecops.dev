# Google Tag Manager (GTM) Verification Guide
## Step-by-Step Instructions for RSS UTM Tracking

**Domain:** https://cyber.netsecops.io  
**Last Updated:** October 13, 2025  
**Purpose:** Verify GTM setup for RSS feed UTM parameter tracking

---

## Prerequisites

✅ Google Tag Manager account  
✅ Google Analytics 4 (GA4) property  
✅ GTM container installed on website  
✅ Admin access to both GTM and GA4

---

## Step 1: Access Google Tag Manager

### 1.1 Login to GTM

1. Go to https://tagmanager.google.com
2. Sign in with your Google account
3. Select your container (should be for `cyber.netsecops.io`)

### 1.2 Identify Your Container

**Container Format:** `GTM-XXXXXXX`

**Where to find it:**
- Top of GTM dashboard
- In your website's `<head>` section
- URL bar when viewing container

**Example:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

---

## Step 2: Verify GA4 Configuration Tag

### 2.1 Navigate to Tags

1. In GTM, click **"Tags"** in left sidebar
2. Look for a tag with type **"Google Analytics: GA4 Configuration"**

**Common names:**
- "GA4 Configuration"
- "Google Analytics 4 Config"
- "GA4 - Configuration"
- "Analytics Configuration"

### 2.2 Check Tag Configuration

Click on the GA4 Configuration tag and verify:

**Required Settings:**

| Setting | What to Check | Where to Find |
|---------|---------------|---------------|
| **Measurement ID** | Format: `G-XXXXXXXXXX` | Tag configuration → Measurement ID field |
| **Tag Type** | Must be "Google Analytics: GA4 Configuration" | Top of tag configuration |
| **Trigger** | Should fire on "All Pages" or "Initialization" | Bottom of tag configuration |

**Screenshot reference:**
```
┌─────────────────────────────────────┐
│ GA4 Configuration                   │
├─────────────────────────────────────┤
│ Tag Type: Google Analytics: GA4     │
│ Configuration                        │
│                                      │
│ Measurement ID: G-XXXXXXXXXX        │
│                                      │
│ Triggering:                          │
│ ✓ Initialization - All Pages        │
└─────────────────────────────────────┘
```

### 2.3 Find Your Measurement ID

**If you don't know your GA4 Measurement ID:**

1. Open GA4: https://analytics.google.com
2. Click **Admin** (gear icon, bottom left)
3. Under "Property" column, click **Data Streams**
4. Click your web stream (cyber.netsecops.io)
5. Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2.4 Verify Measurement ID Match

**IMPORTANT:** The Measurement ID in GTM must match your GA4 property!

**To verify:**
1. GTM Measurement ID: `G-XXXXXXXXXX`
2. GA4 Property Measurement ID: `G-XXXXXXXXXX`
3. They should be identical ✅

---

## Step 3: Verify GA4 Page View Tag

### 3.1 Look for Page View Tag

In GTM **Tags** section, look for:

**Common names:**
- "GA4 - Page View"
- "Google Analytics 4 - Page View"
- "GA4 Event - page_view"
- "Page View - GA4"

**Tag Type:** "Google Analytics: GA4 Event"

### 3.2 Check Page View Tag Settings

Click on the tag and verify:

| Setting | Expected Value | Notes |
|---------|----------------|-------|
| **Tag Type** | Google Analytics: GA4 Event | Must be GA4 Event type |
| **Configuration Tag** | [Your GA4 Configuration tag] | Should reference the config tag from Step 2 |
| **Event Name** | `page_view` | Exact spelling, lowercase |
| **Trigger** | All Pages | Must fire on every page load |

**Screenshot reference:**
```
┌─────────────────────────────────────┐
│ GA4 - Page View                     │
├─────────────────────────────────────┤
│ Tag Type: Google Analytics: GA4     │
│ Event                                │
│                                      │
│ Configuration Tag:                   │
│ → GA4 Configuration                 │
│                                      │
│ Event Name: page_view               │
│                                      │
│ Triggering:                          │
│ ✓ All Pages                         │
└─────────────────────────────────────┘
```

### 3.3 What if I don't have a Page View tag?

**Option A: You might have a different setup**

Some GTM containers send page views directly from the GA4 Configuration tag:

1. Go to your **GA4 Configuration** tag
2. Look for **"Send a page view event when this configuration loads"**
3. If checked ✅, you're good! Page views are being sent.

**Option B: Create a Page View tag** (if needed)

See "Step 6: Create Missing Tags" below.

---

## Step 4: Test with GTM Preview Mode

### 4.1 Enter Preview Mode

1. In GTM, click **"Preview"** (top right)
2. Enter your website URL: `https://cyber.netsecops.io`
3. Click **"Connect"**
4. New window opens with GTM Debug panel

### 4.2 Verify Tags Fire on Page Load

In the GTM Debug panel (usually at bottom of page):

**Look for:**
1. **Container Loaded** event
2. Your **GA4 Configuration** tag should have fired ✅
3. Your **GA4 Page View** tag should have fired ✅

**Screenshot reference:**
```
┌─────────────────────────────────────┐
│ Summary: Container Loaded           │
├─────────────────────────────────────┤
│ Tags Fired (2):                     │
│ ✓ GA4 Configuration                │
│ ✓ GA4 - Page View                  │
│                                      │
│ Tags Not Fired (0):                 │
│                                      │
└─────────────────────────────────────┘
```

### 4.3 Test with UTM Parameters

**Still in Preview Mode:**

1. In your browser address bar, navigate to:
   ```
   https://cyber.netsecops.io/?utm_source=rss&utm_medium=feed&utm_campaign=all_articles
   ```

2. In GTM Debug panel, click **"Page View"** event

3. Click on your **GA4 Page View** tag

4. Click **"Data Layer"** tab

5. Look for UTM parameters:
   ```
   utm_source: "rss"
   utm_medium: "feed"
   utm_campaign: "all_articles"
   ```

**If you see these ✅ - UTM tracking is working!**

### 4.4 Troubleshooting Preview Mode

**Problem:** Preview window won't connect

**Solutions:**
- Disable browser ad blockers
- Try incognito/private mode
- Clear browser cache
- Check browser console for errors
- Make sure GTM snippet is on the page

**Problem:** Tags not firing

**Solutions:**
- Check tag triggers (should be "All Pages")
- Verify GA4 Measurement ID is correct
- Look for JavaScript errors in browser console
- Make sure GTM snippet is properly installed

---

## Step 5: Verify in GA4 DebugView

### 5.1 Enable Debug Mode

**Already enabled if you're using GTM Preview Mode!**

Alternatively, manually enable:
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Click extension icon to enable
3. Reload your website

### 5.2 Open GA4 DebugView

1. Go to GA4: https://analytics.google.com
2. Select your property (cyber.netsecops.io)
3. Click **"Configure"** in left sidebar
4. Click **"DebugView"**

### 5.3 Verify Events Appear

**In DebugView, you should see:**

1. **page_view** event firing
2. Click on the event
3. Check **Event parameters**:
   - `page_location`: Should include full URL with UTM parameters
   - `session_source`: `rss`
   - `session_medium`: `feed`
   - `session_campaign`: `all_articles` (or other campaign)

**Screenshot reference:**
```
┌─────────────────────────────────────┐
│ page_view                           │
├─────────────────────────────────────┤
│ Event Parameters:                   │
│   page_location: https://cyber...   │
│     ...?utm_source=rss&...         │
│   page_title: Article Title         │
│   session_source: rss               │
│   session_medium: feed              │
│   session_campaign: all_articles    │
│                                      │
│ User Properties:                     │
│   ...                                │
└─────────────────────────────────────┘
```

**If you see this ✅ - GA4 is receiving UTM data!**

### 5.4 DebugView Troubleshooting

**Problem:** No events showing in DebugView

**Solutions:**
- Wait 5-10 seconds for events to appear
- Make sure Preview Mode is active
- Refresh the DebugView page
- Check that you're viewing the correct property
- Verify data collection is enabled in GA4

**Problem:** Events show but no UTM parameters

**Solutions:**
- Make sure URL actually contains UTM parameters
- Check browser address bar
- Verify GTM is capturing page URL correctly
- Test with a fresh page load (not cached)

---

## Step 6: Create Missing Tags (If Needed)

### 6.1 Create GA4 Configuration Tag

**If you don't have a GA4 Configuration tag:**

1. In GTM, click **"Tags"** → **"New"**
2. Click **"Tag Configuration"**
3. Choose **"Google Analytics: GA4 Configuration"**
4. Enter your **Measurement ID** (G-XXXXXXXXXX)
5. Click **"Triggering"**
6. Choose **"Initialization - All Pages"** or **"All Pages"**
7. Name the tag: **"GA4 Configuration"**
8. Click **"Save"**

### 6.2 Create GA4 Page View Tag

**If you don't have a Page View tag:**

1. In GTM, click **"Tags"** → **"New"**
2. Click **"Tag Configuration"**
3. Choose **"Google Analytics: GA4 Event"**
4. **Configuration Tag:** Select your GA4 Configuration tag
5. **Event Name:** Enter `page_view`
6. Click **"Triggering"**
7. Choose **"All Pages"**
8. Name the tag: **"GA4 - Page View"**
9. Click **"Save"**

### 6.3 Publish Changes

**CRITICAL:** Changes aren't live until published!

1. Click **"Submit"** (top right)
2. Enter **Version Name:** "Added GA4 Configuration and Page View"
3. Enter **Version Description:** "Setup for RSS UTM tracking"
4. Click **"Publish"**

**Wait 5-10 minutes for changes to propagate**

---

## Step 7: Verify Installation on Live Site

### 7.1 Check GTM Container Code

**View page source of your website:**

1. Go to https://cyber.netsecops.io
2. Right-click → **"View Page Source"**
3. Search for `GTM-` (Ctrl+F or Cmd+F)

**You should find TWO snippets:**

**Snippet 1: In `<head>` section**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**Snippet 2: Right after opening `<body>` tag**
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Both snippets must be present for GTM to work! ✅**

### 7.2 Verify with Tag Assistant

**Install Google Tag Assistant (Legacy):**
1. Chrome Web Store: [Tag Assistant Legacy](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Install extension
3. Navigate to https://cyber.netsecops.io
4. Click Tag Assistant extension icon
5. Click **"Enable"**
6. Reload page

**You should see:**
- ✅ Google Tag Manager detected
- ✅ Google Analytics 4 detected
- No errors 🟢

### 7.3 Check Browser Network Tab

**Developer tools check:**

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **"Network"** tab
3. Filter by: `collect` or `google-analytics`
4. Reload page with UTM parameters:
   ```
   https://cyber.netsecops.io/?utm_source=rss&utm_medium=feed&utm_campaign=test
   ```
5. Look for requests to:
   - `www.google-analytics.com/g/collect`
   - `analytics.google.com/g/collect`

6. Click on a request
7. Check **"Payload"** or **"Request Payload"**
8. Look for:
   ```
   en: "page_view"
   cs: "rss"           (campaign source)
   cm: "feed"          (campaign medium)  
   cn: "test"          (campaign name)
   ```

**If you see this ✅ - Data is being sent to GA4!**

---

## Step 8: Wait for Data in GA4 Reports

### 8.1 Data Processing Time

**Real-time:** DebugView (immediate, when in debug mode)  
**Standard Reports:** 24-48 hours delay

**Important:** UTM data won't appear in standard reports immediately!

### 8.2 Check Real-time Report (After 5 minutes)

1. Go to GA4: https://analytics.google.com
2. Click **"Reports"** → **"Realtime"**
3. Generate traffic with UTM parameters
4. Wait 1-2 minutes
5. Check **"Event count by Event name"**
6. Click **"page_view"**
7. Add dimension: **"Session source"**
8. Look for: `rss`

**If `rss` appears ✅ - Real-time tracking is working!**

### 8.3 Check Traffic Acquisition Report (After 24-48 hours)

1. Go to **"Reports"** → **"Acquisition"** → **"Traffic acquisition"**
2. Look for row with:
   - **Session source / medium:** `rss / feed`
3. Click on the row to see campaigns
4. You should see:
   - `all_publications`
   - `all_articles`
   - `data-breach`
   - `ransomware`
   - etc.

**If you see these ✅ - Full UTM tracking is working!**

---

## Quick Checklist

Use this checklist to verify your setup:

### GTM Container
- [ ] GTM snippet in `<head>` section
- [ ] GTM noscript in `<body>` section  
- [ ] Container ID format: `GTM-XXXXXXX`
- [ ] Latest version published

### GA4 Configuration Tag
- [ ] Tag type: "Google Analytics: GA4 Configuration"
- [ ] Measurement ID present (G-XXXXXXXXXX)
- [ ] Measurement ID matches GA4 property
- [ ] Triggers on "All Pages" or "Initialization"
- [ ] Tag fires in Preview Mode

### GA4 Page View Tag
- [ ] Tag type: "Google Analytics: GA4 Event"
- [ ] Configuration Tag linked correctly
- [ ] Event name: `page_view`
- [ ] Triggers on "All Pages"
- [ ] Tag fires in Preview Mode

### Testing
- [ ] Preview Mode works
- [ ] Tags fire on page load
- [ ] UTM parameters visible in Data Layer
- [ ] Events appear in GA4 DebugView
- [ ] UTM parameters captured in event
- [ ] Real-time reports show RSS source
- [ ] Browser network requests to GA4 successful

### RSS Feeds
- [ ] Feeds contain UTM parameters
- [ ] Links format: `?utm_source=rss&utm_medium=feed&utm_campaign=xxx`
- [ ] All three feeds updated (all.xml, updates.xml, categories/*.xml)
- [ ] Metadata.json generated

---

## Common Issues & Solutions

### Issue: "Tag not firing"

**Causes:**
- Trigger not set to "All Pages"
- Tag paused or disabled
- JavaScript error preventing execution
- Ad blocker blocking GTM

**Solutions:**
- Check trigger configuration
- Verify tag is active (not paused)
- Check browser console for errors
- Disable ad blockers
- Test in incognito mode

### Issue: "No UTM parameters in GA4"

**Causes:**
- UTM parameters not in URL
- Browser caching old page
- RSS reader stripping parameters
- GTM not capturing page URL

**Solutions:**
- Verify URL in browser address bar contains UTM
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Test different RSS readers
- Check GTM Data Layer for page URL

### Issue: "GTM snippet not found"

**Causes:**
- Code not deployed
- Wrong container installed
- Template/framework not rendering GTM

**Solutions:**
- View page source (not DevTools Elements)
- Verify container ID matches GTM
- Check if GTM in Nuxt config or layout file
- Redeploy website

### Issue: "Measurement ID mismatch"

**Causes:**
- Wrong GA4 property ID in GTM
- Multiple properties, using wrong one
- Typo in Measurement ID

**Solutions:**
- Copy ID directly from GA4
- Verify format: G-XXXXXXXXXX (10 characters after G-)
- Update GTM tag
- Republish GTM container

### Issue: "DebugView shows no events"

**Causes:**
- Debug mode not enabled
- Wrong property selected
- Data collection disabled
- Events delayed

**Solutions:**
- Verify GTM Preview Mode is active
- Check correct GA4 property selected
- Go to Admin → Data Settings → Data Collection (should be ON)
- Wait 10-30 seconds
- Refresh DebugView page

---

## Need Help?

### GTM Support
- GTM Help Center: https://support.google.com/tagmanager
- Community: https://www.en.advertisercommunity.com/t5/Google-Tag-Manager/ct-p/Google-Tag-Manager

### GA4 Support
- GA4 Help Center: https://support.google.com/analytics
- Community: https://support.google.com/analytics/community

### Testing Tools
- Google Tag Assistant: Chrome extension
- GA Debugger: Chrome extension
- GTM Preview Mode: Built into GTM

---

## Summary: What You Need

**Minimum Requirements for UTM Tracking:**

1. ✅ **GTM Container installed** on website (2 code snippets)
2. ✅ **GA4 Configuration Tag** with correct Measurement ID
3. ✅ **GA4 Page View Tag** OR Configuration tag sending page views
4. ✅ **Tags triggering on "All Pages"**
5. ✅ **GTM container published** (not just saved)

**That's it!** 

UTM parameters are **automatically captured** by GA4. No additional configuration, variables, or triggers needed for basic UTM tracking.

The RSS feeds already have UTM parameters in the URLs. When users click article links from RSS readers, GA4 will automatically:
- Capture the source (`rss`)
- Capture the medium (`feed`)
- Capture the campaign (`all_articles`, `data-breach`, etc.)
- Attribute the session to RSS traffic

---

**Setup Status:** Ready to verify  
**Next Steps:** Follow Steps 1-8 above to verify your GTM configuration
