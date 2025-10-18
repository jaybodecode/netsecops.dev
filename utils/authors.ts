/**
 * Default author profiles for CyberNetSec.io
 * Used for article bylines and establishing trust signals
 */

import type { Author } from '~/types/cyber'

/**
 * Jason Gomes - Founder & Lead Analyst
 */
export const JASON_GOMES_AUTHOR: Author = {
  id: 'jason-gomes',
  name: 'Jason Gomes',
  role: 'CybeNetSec.io Founder &  Cybersecurity Practitioner',
  bio: 'Cybersecurity professional with over 5 years of specialized experience in security operations, threat intelligence, incident response, and security automation. Expertise spans SOAR/XSOAR orchestration, threat intelligence platforms, SIEM/UEBA analytics, and cyber fusion center operations. Background includes technical enablement, solution architecture for enterprise and government clients, and implementing security automation workflows across IR, TIP, and SOC use cases.',
  avatar: '/images/bio-images/JasonGomes.jpeg',
  expertise: [
    'Threat Intelligence & Analysis',
    'Security Orchestration (SOAR/XSOAR)',
    'Incident Response & Digital Forensics',
    'Security Operations Center (SOC)',
    'SIEM & Security Analytics',
    'Cyber Fusion & Threat Sharing',
    'Security Automation & Integration',
    'Managed Detection & Response (MDR)'
  ],
  email: 'cyber@sharefront.net',
  social: {
    linkedin: 'https://www.linkedin.com/in/jasongomes/',
    website: 'https://cybernetsec.io'
  }
}

/**
 * CyberNetSec.io Team - Legacy/Fallback author
 */
export const CYBERNETSEC_TEAM_AUTHOR: Author = {
  id: 'cybernetsec-team',
  name: 'CyberNetSec.io Team',
  role: 'Cybersecurity Intelligence Analysts',
  bio: 'A dedicated team of cybersecurity professionals with expertise in threat intelligence, malware analysis, incident response, and security operations. We combine human expertise with intelligent automation to deliver actionable threat intelligence based on MITRE ATT&CK and D3FEND frameworks.',
  expertise: [
    'Threat Intelligence',
    'MITRE ATT&CK Mapping',
    'Malware Analysis',
    'Incident Response',
    'Security Operations',
    'Vulnerability Assessment',
    'D3FEND Countermeasures'
  ],
  email: 'cyber@sharefront.net',
  social: {
    website: 'https://cybernetsec.io'
  }
}

/**
 * Get author by ID or return default
 */
export function getAuthor(authorId?: string): Author {
  // Return Jason Gomes as the primary author
  if (!authorId || authorId === 'jason-gomes') {
    return JASON_GOMES_AUTHOR
  }
  
  // Fallback to team author if specified
  if (authorId === 'cybernetsec-team') {
    return CYBERNETSEC_TEAM_AUTHOR
  }
  
  // Default to Jason Gomes
  return JASON_GOMES_AUTHOR
}

/**
 * All available authors (for future expansion)
 */
export const AUTHORS: Record<string, Author> = {
  'jason-gomes': JASON_GOMES_AUTHOR,
  'cybernetsec-team': CYBERNETSEC_TEAM_AUTHOR,
  // Future: Add additional team member profiles here
}
