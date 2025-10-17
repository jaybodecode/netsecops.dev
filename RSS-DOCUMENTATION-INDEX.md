# RSS Feed System Documentation Index

## 📚 Complete Documentation Suite for RSS Feeds with UTM Tracking

---

## Quick Start Guide

**New to this project?** Start here:

1. **Read:** `GTM-QUICK-REFERENCE.md` (5 min visual guide)
2. **Verify:** Your GTM setup using the quick checklist
3. **Test:** Follow the Preview Mode instructions
4. **Deploy:** Your RSS feeds are ready!

---

## Documentation Files

### 1. RSS-SYSTEM-DOCUMENTATION.md
**Purpose:** Complete as-built technical documentation  
**Audience:** Developers, system administrators  
**Contents:**
- System architecture
- Database schema
- Feed specifications (all 3 types)
- UTM tracking implementation
- File structure
- Maintenance procedures
- Troubleshooting

**When to use:**
- Understanding how the system works
- Making code changes
- Adding new features
- Debugging feed generation issues
- Reference during development

---

### 2. GOOGLE-ANALYTICS-RSS-SETUP.md
**Purpose:** Complete Google Analytics 4 setup and reporting guide  
**Audience:** Marketing, analytics, product managers  
**Contents:**
- GA4 basic setup (automatic)
- GTM configuration requirements
- Advanced event tracking (optional)
- Custom report creation
- Testing procedures
- Troubleshooting analytics issues
- Expected results timeline

**When to use:**
- Setting up GA4 for first time
- Creating custom RSS traffic reports
- Understanding analytics data
- Troubleshooting tracking issues
- Planning analytics strategy

---

### 3. GTM-VERIFICATION-GUIDE.md
**Purpose:** Detailed step-by-step GTM verification instructions  
**Audience:** Anyone verifying GTM setup (technical or non-technical)  
**Contents:**
- Step-by-step verification process (8 steps)
- How to access GTM
- Finding GA4 Configuration tag
- Finding GA4 Page View tag
- Testing with Preview Mode
- Verifying in DebugView
- Creating missing tags
- Common issues with solutions

**When to use:**
- First-time GTM verification
- Troubleshooting GTM issues
- Creating tags from scratch
- Detailed testing procedures
- Learning GTM basics

---

### 4. GTM-QUICK-REFERENCE.md
**Purpose:** Visual quick reference guide with screenshots/diagrams  
**Audience:** Everyone - quickest way to verify GTM  
**Contents:**
- 3-item checklist (visual)
- Preview Mode testing guide
- DebugView verification
- Common problems with visual comparisons
- Tag status icons explained
- Success criteria

**When to use:**
- Quick GTM verification (10-15 min)
- Visual learners
- Need a checklist
- Quick problem diagnosis
- Reference during testing

---

## Which Doc Should I Read?

### Scenario 1: "I need to verify my GTM setup works"
→ Start with: **GTM-QUICK-REFERENCE.md** (quickest)  
→ If issues: **GTM-VERIFICATION-GUIDE.md** (detailed)

### Scenario 2: "I need to understand how RSS feeds work"
→ Read: **RSS-SYSTEM-DOCUMENTATION.md**

### Scenario 3: "I need to set up Google Analytics reports"
→ Read: **GOOGLE-ANALYTICS-RSS-SETUP.md**

### Scenario 4: "I need to modify the RSS generation code"
→ Read: **RSS-SYSTEM-DOCUMENTATION.md** (Architecture + Implementation)

### Scenario 5: "GTM tags aren't firing - help!"
→ Read: **GTM-VERIFICATION-GUIDE.md** → Step 4 (Testing)  
→ Check: **GTM-QUICK-REFERENCE.md** → Common Problems

### Scenario 6: "I want to see RSS traffic in GA4"
→ Read: **GOOGLE-ANALYTICS-RSS-SETUP.md** → Viewing RSS Data

---

## System Overview

### What We Built

**RSS 2.0 Feed System** providing cybersecurity threat intelligence via:
- ✅ All Publications Feed (daily/weekly/monthly/special reports)
- ✅ All Articles Feed (new + updated articles with tags)
- ✅ Category-Specific Feeds (8 categories: data-breach, ransomware, etc.)
- ✅ UTM Tracking for Google Analytics (source: rss, medium: feed)
- ✅ RSS Subscription Page (/rss)
- ✅ Automated Feed Generation (Step 8 of pipeline)

### Key Features

**UTM Parameters:**
```
?utm_source=rss&utm_medium=feed&utm_campaign={feed_name}
```

**Feeds Update:** Daily before 9:30 AM CST  
**Domain:** https://cyber.netsecops.io  
**Format:** RSS 2.0 XML (standards-compliant)  
**Hosting:** Static files (CDN-friendly)

---

## Quick Links

### RSS Feeds (Production)
- **All Publications:** https://cyber.netsecops.io/rss/all.xml
- **All Articles:** https://cyber.netsecops.io/rss/updates.xml
- **Categories:** https://cyber.netsecops.io/rss/categories/{category-slug}.xml
- **Subscription Page:** https://cyber.netsecops.io/rss

### Local Files
- **Generation Script:** `scripts/content-generation/cli/generate-rss-feeds.ts`
- **Subscription Page:** `pages/rss.vue`
- **Feed Directory:** `public/rss/`
- **Database:** `logs/content-generation.db`

### External Services
- **Google Tag Manager:** https://tagmanager.google.com
- **Google Analytics 4:** https://analytics.google.com
- **RSS Validator:** https://validator.w3.org/feed/

---

## Testing Commands

### Regenerate All Feeds
```bash
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

### Verify UTM Parameters
```bash
grep "utm_source=rss" public/rss/all.xml
grep "utm_source=rss" public/rss/updates.xml
grep "utm_source=rss" public/rss/categories/*.xml
```

### Check Feed Metadata
```bash
cat public/rss/metadata.json | jq '.feeds'
```

### Validate Feed Content
```bash
head -n 30 public/rss/all.xml
```

### Check Database
```bash
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
```

---

## File Dependencies

### RSS Generation Dependencies

```
logs/content-generation.db (SQLite)
         ↓
scripts/content-generation/cli/generate-rss-feeds.ts
         ↓
     Generates:
         ├── public/rss/all.xml
         ├── public/rss/updates.xml
         ├── public/rss/categories/*.xml
         └── public/rss/metadata.json
              ↓
         pages/rss.vue (loads metadata)
```

### GTM → GA4 Flow

```
Website loads with GTM snippet
         ↓
GTM Container fires
         ↓
GA4 Configuration Tag loads
         ↓
GA4 Page View Tag sends event
         ↓
GA4 captures UTM from URL automatically
         ↓
Data appears in GA4 reports (24-48 hours)
```

---

## Maintenance Schedule

### Daily (Automated)
- ✅ RSS feeds regenerated (before 9:30 AM CST)
- ✅ Content pipeline runs (Steps 1-8)
- ✅ Feed metadata updated

### Weekly (Manual Check)
- Review GA4 Traffic Acquisition report
- Check feed subscriber counts (if using FeedBurner/similar)
- Verify feed validation passes

### Monthly (Manual Check)
- Review most popular feeds/articles from RSS
- Check for new categories (auto-generates feeds)
- Review analytics trends
- Update documentation if system changes

### As Needed
- Regenerate feeds manually if content updated
- Clear CDN cache if feeds not updating
- Republish GTM if tags modified

---

## Support & Resources

### Internal Documentation
- `RSS-SYSTEM-DOCUMENTATION.md` - Technical reference
- `GOOGLE-ANALYTICS-RSS-SETUP.md` - Analytics guide
- `GTM-VERIFICATION-GUIDE.md` - Detailed GTM verification
- `GTM-QUICK-REFERENCE.md` - Quick visual guide

### External Resources
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [W3C Feed Validator](https://validator.w3.org/feed/)
- [Google Tag Manager Help](https://support.google.com/tagmanager)
- [Google Analytics 4 Help](https://support.google.com/analytics)
- [UTM Parameters Guide](https://support.google.com/analytics/answer/10917952)

### Code Comments
- Inline documentation in `generate-rss-feeds.ts`
- Component documentation in `pages/rss.vue`

---

## Status & Version

**System Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** October 13, 2025  
**Next Review:** Monthly or as needed

**Feeds Generated:**
- 4 publications (all.xml)
- 7 articles (updates.xml)
- 8 category feeds

**UTM Tracking:** ✅ Implemented  
**GTM Verification:** Pending user verification  
**Deployment:** Ready

---

## Change Log

### October 13, 2025 - v1.0 Initial Release
- ✅ RSS feed system implementation
- ✅ Three feed types (publications, articles, categories)
- ✅ UTM tracking parameters added
- ✅ RSS subscription page created
- ✅ Metadata generation
- ✅ Pipeline integration (Step 8)
- ✅ Heroicons UI (removed emojis)
- ✅ 9:30 AM CST daily schedule
- ✅ Domain updated (cyber.netsecops.io)
- ✅ Feed statistics improved
- ✅ Static feed notice added
- ✅ Complete documentation suite created

---

## Next Steps

### For Deployment
1. ✅ RSS feeds generated with UTM parameters
2. ⏳ Verify GTM setup (use GTM-QUICK-REFERENCE.md)
3. ⏳ Deploy updated feeds to production
4. ⏳ Test feeds in RSS readers
5. ⏳ Monitor GA4 reports (24-48 hours)

### Post-Deployment
1. Validate feeds with W3C validator
2. Test with multiple RSS readers (Feedly, NetNewsWire, etc.)
3. Verify UTM tracking in GA4 Realtime reports
4. Create custom GA4 reports for RSS traffic
5. Share RSS subscription page link
6. Monitor RSS engagement metrics

---

## Questions?

### Documentation Questions
Refer to the specific documentation file based on your need (see "Which Doc Should I Read?" above)

### Technical Issues
1. Check troubleshooting sections in respective docs
2. Review code comments in source files
3. Test with validation tools
4. Check browser console for errors

### Analytics Questions
See `GOOGLE-ANALYTICS-RSS-SETUP.md` for comprehensive GA4 guidance

### GTM Questions
See `GTM-VERIFICATION-GUIDE.md` for detailed step-by-step instructions

---

**Documentation Complete** ✅  
**System Ready for Deployment** 🚀
