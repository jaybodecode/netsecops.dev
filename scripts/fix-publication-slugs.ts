/**
 * Fix Publication Article Slugs
 * Updates article slugs in publications to match current articles-index
 */

import fs from 'fs/promises';
import path from 'path';

// Mapping of old slugs to new slugs (from build errors)
const slugMapping: Record<string, string> = {
  'critical-openssh-flaw-allows-rce-via-proxycommand-injection': 'critical-openssh-flaw-allows-rce-via-proxycommand-manipulation',
  'ransomware-giants-lockbit-qilin-dragonforce-form-strategic-alliance': 'ransomware-giants-lockbit-qilin-dragonforce-form-alliance',
  'clop-linked-campaign-exploits-oracle-ebs-0-day-for-mass-data-theft': 'clop-exploits-oracle-ebs-zero-day-in-mass-extortion-campaign',
  'new-white-lock-ransomware-strain-emerges-with-4-day-deadline': 'new-white-lock-ransomware-demands-4-bitcoin-threatens-data-publication',
  'microsofts-october-2025-patch-tuesday-ends-support-for-windows-10-office': 'microsoft-uncovers-payroll-pirate-campaign-stealing-salaries',
  'payroll-pirates-campaign-targets-us-universities-to-hijack-salary-payments': 'beamglea-campaign-abuses-npm-and-unpkg-cdn-for-phishing',
  'windows-10-end-of-life-marks-final-public-patch-tuesday': 'new-android-trojan-datzbro-targets-seniors-via-fake-facebook-groups',
};

async function fixPublicationSlugs() {
  const publicationsDir = path.join(process.cwd(), 'public/data/publications');
  const files = await fs.readdir(publicationsDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  let totalFixed = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(publicationsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    let publication = JSON.parse(content);
    let modified = false;
    
    // Check articles array for old slugs
    if (publication.articles && Array.isArray(publication.articles)) {
      for (const article of publication.articles) {
        if (article.slug && slugMapping[article.slug]) {
          console.log(`Fixing: ${article.slug} -> ${slugMapping[article.slug]} in ${file}`);
          article.slug = slugMapping[article.slug];
          modified = true;
          totalFixed++;
        }
      }
    }
    
    // Write back if modified
    if (modified) {
      await fs.writeFile(filePath, JSON.stringify(publication, null, 2), 'utf-8');
      console.log(`✅ Updated ${file}`);
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} article slugs across ${jsonFiles.length} publications`);
}

fixPublicationSlugs().catch(console.error);
