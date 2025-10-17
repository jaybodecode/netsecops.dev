/**
 * Image utilities for mapping categories and publication types to images
 */

import type { ArticleCategory } from '~/types/cyber';

/**
 * Publication types - matches the schema from publication-unified-zod.ts
 */
export type PublicationType = 'daily' | 'weekly' | 'monthly' | 'special-report';

/**
 * Category to image mapping
 */
const CATEGORY_IMAGE_MAP: Record<ArticleCategory, string> = {
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
 * Publication type to image mapping
 */
const PUBLICATION_TYPE_IMAGE_MAP: Record<PublicationType, string> = {
  'daily': 'daily.png',
  'weekly': 'weekly.png',
  'monthly': 'monthly.png',
  'special-report': 'special-report.png',
};

/**
 * Get image URL for a category
 */
export function getCategoryImageUrl(category: ArticleCategory): string {
  const imageName = CATEGORY_IMAGE_MAP[category] || CATEGORY_IMAGE_MAP['Other'];
  return `/images/categories/${imageName}`;
}

/**
 * Get image URL for a publication type
 */
export function getPublicationTypeImageUrl(type: PublicationType): string {
  const imageName = PUBLICATION_TYPE_IMAGE_MAP[type] || PUBLICATION_TYPE_IMAGE_MAP['daily'];
  return `/images/publications/${imageName}`;
}

/**
 * Get image URL for an article based on its primary category
 */
export function getArticleImageUrl(categories?: string[]): string {
  if (!categories || categories.length === 0) {
    return getCategoryImageUrl('Other');
  }
  
  const primaryCategory = categories[0] as ArticleCategory;
  return getCategoryImageUrl(primaryCategory);
}

/**
 * Get image URL for a publication based on its type
 */
export function getPublicationImageUrl(type: string): string {
  return getPublicationTypeImageUrl(type as PublicationType);
}