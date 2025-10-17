# Google Analytics 4 RSS Feed Tracking Setup

## UTM Parameters in RSS Feeds

All RSS feed article links now include UTM tracking parameters:

### Feed Types and UTM Campaigns

| Feed | utm_source | utm_medium | utm_campaign |
|------|-----------|------------|--------------|
| All Publications | `rss` | `feed` | `all_publications` |
| All Articles | `rss` | `feed` | `all_articles` |
| Data Breach | `rss` | `feed` | `data-breach` |
| Threat Actor | `rss` | `feed` | `threat-actor` |
| Ransomware | `rss` | `feed` | `ransomware` |
| Supply Chain | `rss` | `feed` | `supply-chain-attack` |
| Vulnerability | `rss` | `feed` | `vulnerability` |
| Cloud Security | `rss` | `feed` | `cloud-security` |
| Cyberattack | `rss` | `feed` | `cyberattack` |
| ICS | `rss` | `feed` | `industrial-control-systems` |

---

## Basic Setup (Automatic)

### ✅ No Additional Configuration Needed!

If your Google Tag Manager (GTM) already has:
- **GA4 Configuration Tag** with your Measurement ID
- **GA4 Page View Tag** that fires on all pages

Then **UTM parameters are automatically captured** by GA4!

### How to Verify:

1. **Check GTM Container:**
   - Login to [tagmanager.google.com](https://tagmanager.google.com)
   - Verify you have a **Google Analytics: GA4 Configuration** tag
   - Verify you have a **Google Analytics: GA4 Event (page_view)** tag
   - Both should fire on "All Pages" trigger

2. **Test in GTM Preview Mode:**
   - Click "Preview" in GTM
   - Navigate to: `https://cyber.netsecops.io/articles/test-article?utm_source=rss&utm_medium=feed&utm_campaign=all_articles`
   - Check that GA4 tags fire
   - Verify UTM parameters are captured in the event

3. **View in GA4 (24-48 hours after deployment):**
   - Go to **Reports** → **Acquisition** → **Traffic acquisition**
   - Filter by **Source:** `rss`
   - You should see campaigns: `all_publications`, `all_articles`, category names

---

## Advanced Setup (Optional)

### Create Custom RSS Engagement Event

To track RSS feed clicks as a specific event:

#### 1. Create Data Layer Variable in GTM

**Variable Name:** `RSS Campaign`
- **Variable Type:** URL
- **Component Type:** Query
- **Query Key:** `utm_campaign`

#### 2. Create Custom Event Tag

**Tag Name:** RSS Feed Click
- **Tag Type:** Google Analytics: GA4 Event
- **Configuration Tag:** [Your GA4 Config]
- **Event Name:** `rss_feed_click`
- **Event Parameters:**
  - `feed_type`: `{{RSS Campaign}}`
  - `source`: `rss`
  - `medium`: `feed`

#### 3. Create Trigger

**Trigger Name:** RSS Traffic
- **Trigger Type:** Page View
- **This trigger fires on:** Some Page Views
- **Fire this trigger when:** `Page URL` contains `?utm_source=rss`

---

## Custom Reports in GA4

### 1. RSS Traffic Overview Report

**Explorations** → **Create New** → **Free Form**

**Dimensions:**
- Campaign
- Page title
- Device category

**Metrics:**
- Sessions
- Engaged sessions
- Average engagement time
- Conversions (if applicable)

**Filters:**
- Session source = `rss`

### 2. RSS Feed Performance Report

Compare which feeds drive most engagement:

**Dimensions:** Campaign
**Metrics:** 
- Sessions
- Engagement rate
- Pages per session
- Average engagement time

**Filter:** Session medium = `feed`

### 3. RSS Article Performance

See which articles get most RSS clicks:

**Dimensions:**
- Page path
- Page title
- Campaign

**Metrics:**
- Views
- Users
- Average engagement time

**Filter:** Session source = `rss`

---

## Viewing RSS Data in GA4

### Real-time Reports (Immediate)

1. Go to **Reports** → **Realtime**
2. Under **Event count by Event name**, you'll see `page_view` events
3. Click on `page_view` 
4. Add filter: `utm_source = rss`
5. See RSS traffic in real-time!

### Standard Reports (24-48 hour delay)

**Traffic Acquisition:**
- **Reports** → **Acquisition** → **Traffic acquisition**
- Look for source: `rss`, medium: `feed`

**Pages and Screens:**
- **Reports** → **Engagement** → **Pages and screens**
- Add secondary dimension: **Session campaign**
- Filter by: `rss` campaigns

---

## Testing Your Setup

### 1. Test UTM Links Locally

Before deploying, test links work:

```bash
# Check all.xml has UTM parameters
grep "utm_source=rss" public/rss/all.xml

# Check updates.xml
grep "utm_source=rss" public/rss/updates.xml

# Check category feeds
grep "utm_source=rss" public/rss/categories/*.xml
```

### 2. Test in RSS Reader

After deployment:
1. Add feed to your RSS reader (Feedly, NetNewsWire, etc.)
2. Click an article link
3. Verify URL includes UTM parameters in browser address bar
4. Check GTM preview mode or browser console for GA4 events

### 3. Use Campaign URL Builder

Test links directly:
`https://cyber.netsecops.io/articles/test-article?utm_source=rss&utm_medium=feed&utm_campaign=all_articles`

Or use [Google's Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/)

### 4. DebugView in GA4

**Real-time debugging:**
1. Go to **Configure** → **DebugView** in GA4
2. Visit a page with UTM parameters
3. See events fire in real-time with parameter details

---

## Troubleshooting

### UTM Parameters Not Showing in GA4

**Check:**
1. ✅ GTM container is published (not just saved)
2. ✅ GA4 Configuration tag is firing on all pages
3. ✅ GA4 Measurement ID is correct
4. ✅ Data collection is enabled in GA4 settings
5. ✅ UTM parameters are in the URL (check browser address bar)
6. ⏰ Wait 24-48 hours for data to appear in standard reports

### GTM Tags Not Firing

**Debug:**
1. Use GTM Preview Mode
2. Check browser console for errors
3. Verify trigger conditions match
4. Check that ad blockers aren't blocking GA4

### RSS Readers Stripping UTM Parameters

Most RSS readers preserve URL parameters, but test with:
- Feedly
- NetNewsWire  
- Inoreader
- Browser-based readers

If a reader strips parameters, the traffic will show as "Direct" in GA4.

---

## Expected Results

After deploying and waiting 24-48 hours, you should see:

### In GA4 Traffic Acquisition:
- **Source:** `rss`
- **Medium:** `feed`  
- **Campaign:** Multiple campaigns (all_publications, all_articles, category names)

### Engagement Metrics:
- Sessions from RSS
- Which feeds drive most traffic
- Which articles are most popular from RSS
- Time on page from RSS traffic
- Bounce rate from RSS traffic

### User Behavior:
- Do RSS users read more articles?
- Do RSS users convert better?
- Which categories have most engaged RSS readers?

---

## Maintenance

### When Adding New Categories

RSS feeds automatically generate category feeds. New categories will automatically get UTM tracking:

`?utm_source=rss&utm_medium=feed&utm_campaign={category-slug}`

No GA4 changes needed - new campaigns appear automatically!

### Changing UTM Parameters

If you want to change UTM structure, edit these lines in `generate-rss-feeds.ts`:

```typescript
// All Publications (line ~149)
link: `${BASE_URL}/publications/${pub.slug}?utm_source=rss&utm_medium=feed&utm_campaign=all_publications`,

// All Articles (line ~261) 
link: `${BASE_URL}/articles/${article.slug}?utm_source=rss&utm_medium=feed&utm_campaign=all_articles`,

// Category Feeds (line ~421)
link: `${BASE_URL}/articles/${article.slug}?utm_source=rss&utm_medium=feed&utm_campaign=${slug}`,
```

Then regenerate feeds:
```bash
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

---

## Additional Resources

- [GA4 Campaign Parameters](https://support.google.com/analytics/answer/10917952)
- [GTM Documentation](https://support.google.com/tagmanager/answer/6102821)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/)

---

## Summary

✅ **What's Working:**
- All RSS feed links include UTM parameters
- Parameters identify source (`rss`), medium (`feed`), and specific feed (`campaign`)
- GA4 automatically captures these parameters
- No GTM configuration changes needed (if basic GA4 is set up)

✅ **What You'll See:**
- RSS traffic separated in GA4 reports
- Which feeds drive most engagement  
- Which articles are popular from RSS
- User behavior patterns from RSS readers

✅ **Next Steps:**
1. Deploy updated RSS feeds to production
2. Wait 24-48 hours for data
3. Check GA4 Reports → Acquisition → Traffic acquisition
4. Look for source: `rss`, medium: `feed`
5. Create custom reports for deeper insights
