/**
 * Article Category Utilities
 * Helpers for working with article categories
 */

import type { ArticleCategory } from './cyber';

/**
 * All available article categories
 */
export const ARTICLE_CATEGORIES: readonly ArticleCategory[] = [
  'Malware',
  'Threat Actor',
  'Vulnerability',
  'Data Breach',
  'Threat Briefing',
  'Ransomware',
  'Phishing',
  'Supply Chain Attack',
  'Zero-Day Exploit',
  'Cyberattack',
  'Campaign',
  'Insider Threat',
  'IoT Security',
  'Cloud Security',
  'Network Security',
  'Endpoint Security',
  'Incident Response',
  'Compliance and Regulation',
  'Emerging Threats',
  'Cybersecurity Awareness',
  'Digital Forensics',
  'Cryptocurrency and Blockchain',
  'AI and Machine Learning in Security',
  'Mobile Security',
  'Web Application Security',
  'Industrial Control Systems (ICS)',
  'Other',
] as const;

/**
 * Category metadata for UI display
 */
export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
  description: string;
}

/**
 * Category metadata mapping
 */
export const CATEGORY_META: Record<ArticleCategory, CategoryMeta> = {
  'Malware': {
    label: 'Malware',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'heroicons:bug-ant-20-solid',
    description: 'Malicious software threats'
  },
  'Threat Actor': {
    label: 'Threat Actor',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'heroicons:user-group-20-solid',
    description: 'APT groups and threat actors'
  },
  'Vulnerability': {
    label: 'Vulnerability',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'heroicons:shield-exclamation-20-solid',
    description: 'Security vulnerabilities and CVEs'
  },
  'Data Breach': {
    label: 'Data Breach',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'heroicons:lock-open-20-solid',
    description: 'Data exposure incidents'
  },
  'Threat Briefing': {
    label: 'Threat Briefing',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'heroicons:document-text-20-solid',
    description: 'Threat intelligence summaries'
  },
  'Ransomware': {
    label: 'Ransomware',
    color: 'text-red-800 dark:text-red-200',
    bgColor: 'bg-red-200 dark:bg-red-900/40',
    icon: 'heroicons:lock-closed-20-solid',
    description: 'Ransomware attacks'
  },
  'Phishing': {
    label: 'Phishing',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'heroicons:envelope-20-solid',
    description: 'Phishing and social engineering'
  },
  'Supply Chain Attack': {
    label: 'Supply Chain',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: 'heroicons:cube-20-solid',
    description: 'Supply chain compromises'
  },
  'Zero-Day Exploit': {
    label: 'Zero-Day',
    color: 'text-red-900 dark:text-red-100',
    bgColor: 'bg-red-300 dark:bg-red-900/50',
    icon: 'heroicons:bolt-20-solid',
    description: 'Zero-day vulnerabilities'
  },
  'Cyberattack': {
    label: 'Cyberattack',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'heroicons:fire-20-solid',
    description: 'Cyber attack incidents'
  },
  'Campaign': {
    label: 'Campaign',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'heroicons:chart-bar-20-solid',
    description: 'Coordinated attack campaigns'
  },
  'Insider Threat': {
    label: 'Insider Threat',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'heroicons:user-minus-20-solid',
    description: 'Internal security threats'
  },
  'IoT Security': {
    label: 'IoT Security',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'heroicons:cpu-chip-20-solid',
    description: 'Internet of Things security'
  },
  'Cloud Security': {
    label: 'Cloud Security',
    color: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    icon: 'heroicons:cloud-20-solid',
    description: 'Cloud infrastructure security'
  },
  'Network Security': {
    label: 'Network Security',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'heroicons:server-20-solid',
    description: 'Network security issues'
  },
  'Endpoint Security': {
    label: 'Endpoint Security',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: 'heroicons:computer-desktop-20-solid',
    description: 'Endpoint protection'
  },
  'Incident Response': {
    label: 'Incident Response',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'heroicons:shield-check-20-solid',
    description: 'Incident handling and response'
  },
  'Compliance and Regulation': {
    label: 'Compliance',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    icon: 'heroicons:scale-20-solid',
    description: 'Regulatory compliance'
  },
  'Emerging Threats': {
    label: 'Emerging Threats',
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'heroicons:sparkles-20-solid',
    description: 'New threat vectors'
  },
  'Cybersecurity Awareness': {
    label: 'Awareness',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    icon: 'heroicons:academic-cap-20-solid',
    description: 'Security awareness and training'
  },
  'Digital Forensics': {
    label: 'Digital Forensics',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    icon: 'heroicons:magnifying-glass-20-solid',
    description: 'Forensic investigation'
  },
  'Cryptocurrency and Blockchain': {
    label: 'Crypto/Blockchain',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'heroicons:currency-dollar-20-solid',
    description: 'Cryptocurrency security'
  },
  'AI and Machine Learning in Security': {
    label: 'AI/ML Security',
    color: 'text-fuchsia-700 dark:text-fuchsia-300',
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    icon: 'heroicons:beaker-20-solid',
    description: 'AI and ML in cybersecurity'
  },
  'Mobile Security': {
    label: 'Mobile Security',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'heroicons:device-phone-mobile-20-solid',
    description: 'Mobile device security'
  },
  'Web Application Security': {
    label: 'Web App Security',
    color: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    icon: 'heroicons:globe-alt-20-solid',
    description: 'Web application vulnerabilities'
  },
  'Industrial Control Systems (ICS)': {
    label: 'ICS/SCADA',
    color: 'text-stone-700 dark:text-stone-300',
    bgColor: 'bg-stone-100 dark:bg-stone-900/30',
    icon: 'heroicons:wrench-screwdriver-20-solid',
    description: 'Industrial control systems'
  },
  'Other': {
    label: 'Other',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: 'heroicons:ellipsis-horizontal-20-solid',
    description: 'Miscellaneous articles'
  },
};

/**
 * Get category metadata
 */
export function getCategoryMeta(category: ArticleCategory): CategoryMeta {
  return CATEGORY_META[category];
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: ArticleCategory): string {
  return CATEGORY_META[category].label;
}

/**
 * Get category color classes
 */
export function getCategoryColors(category: ArticleCategory): { color: string; bgColor: string } {
  const meta = CATEGORY_META[category];
  return {
    color: meta.color,
    bgColor: meta.bgColor,
  };
}

/**
 * Check if a string is a valid category
 */
export function isValidCategory(value: string): value is ArticleCategory {
  return ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: ArticleCategory): string | undefined {
  return CATEGORY_META[category].icon;
}
