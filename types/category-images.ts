/**
 * Category Image Mapping
 * Maps article categories to their default featured images
 * These are fallback images used when an article doesn't have a specific featured image
 */

import type { ArticleCategory } from './cyber';

/**
 * Category image mapping
 * Format: category → image filename in Firebase Storage /images/categories/
 */
export const CATEGORY_IMAGES: Record<ArticleCategory, string> = {
  'Malware': 'malware.png',
  'Threat Actor': 'threat-actor.png',
  'Vulnerability': 'vulnerability.png',
  'Data Breach': 'data-breach.png',
  'Threat Briefing': 'threat-briefing.png',
  'Ransomware': 'ransomware.png',
  'Phishing': 'phishing.png',
  'Supply Chain Attack': 'supply-chain.png',
  'Zero-Day Exploit': 'zero-day.png',
  'Cyberattack': 'cyberattack.png',
  'Campaign': 'campaign.png',
  'Insider Threat': 'insider-threat.png',
  'IoT Security': 'iot-security.png',
  'Cloud Security': 'cloud-security.png',
  'Network Security': 'network-security.png',
  'Endpoint Security': 'endpoint-security.png',
  'Incident Response': 'incident-response.png',
  'Compliance and Regulation': 'compliance.png',
  'Emerging Threats': 'emerging-threats.png',
  'Cybersecurity Awareness': 'cybersecurity-awareness.png',
  'Digital Forensics': 'digital-forensics.png',
  'Cryptocurrency and Blockchain': 'cryptocurrency.png',
  'AI and Machine Learning in Security': 'ai-security.png',
  'Mobile Security': 'mobile-security.png',
  'Web Application Security': 'web-security.png',
  'Industrial Control Systems (ICS)': 'ics-security.png',
  'Other': 'other.png',
};

/**
 * Get category image filename
 */
export function getCategoryImageFilename(category: ArticleCategory): string {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Other'];
}

/**
 * Get all category image filenames (for upload script)
 */
export function getAllCategoryImageFilenames(): string[] {
  return Object.values(CATEGORY_IMAGES);
}

/**
 * Get category from image filename
 */
export function getCategoryFromImageFilename(filename: string): ArticleCategory | null {
  const entry = Object.entries(CATEGORY_IMAGES).find(([_, img]) => img === filename);
  return entry ? (entry[0] as ArticleCategory) : null;
}
