/**
 * DEFCON (Defense Condition) Levels
 * Based on the famous military alert system
 * Lower numbers = Higher alert
 */
export type DefconLevel = 1 | 2 | 3 | 4 | 5;

/**
 * DEFCON Configuration
 */
export interface DefconConfig {
  /** Current DEFCON level (1-5, where 1 is maximum readiness) */
  level: DefconLevel;
  
  /** Human-readable description of current state */
  description: string;
  
  /** ISO timestamp of when this level was last updated */
  lastUpdated: string;
  
  /** Explanation for current DEFCON level */
  reason?: string;
}

/**
 * Site-wide feature flags and settings
 */
export interface SiteFeatures {
  commentsEnabled: boolean;
  searchEnabled: boolean;
  notificationsEnabled: boolean;
}

/**
 * General site configuration
 */
export interface SiteSettings {
  /** Whether site is in maintenance mode */
  maintenanceMode: boolean;
  
  /** Optional announcement banner message */
  announcementBanner: string | null;
  
  /** Feature flags */
  features: SiteFeatures;
}

/**
 * Metadata about the configuration file itself
 */
export interface ConfigMetadata {
  /** Configuration schema version */
  version: string;
  
  /** ISO timestamp of last sync from remote server */
  lastSync: string;
  
  /** Source identifier for the sync */
  syncSource?: string;
}

/**
 * Complete site configuration structure
 * This can be updated by remote server to control site behavior
 */
export interface SiteConfig {
  defcon: DefconConfig;
  site: SiteSettings;
  metadata: ConfigMetadata;
}

/**
 * DEFCON Level Display Properties
 * Visual representation for each DEFCON level
 */
export interface DefconDisplay {
  level: DefconLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: string;
  description: string;
}

/**
 * Default DEFCON display configurations
 */
export const DEFCON_LEVELS: Record<DefconLevel, Omit<DefconDisplay, 'level'>> = {
  1: {
    label: 'DEFCON 1',
    color: 'text-red-500',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    icon: 'heroicons:shield-exclamation-20-solid',
    description: 'Maximum Readiness - Critical Threat Active',
  },
  2: {
    label: 'DEFCON 2',
    color: 'text-orange-500',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    icon: 'heroicons:exclamation-triangle-20-solid',
    description: 'High Alert - Significant Threats Detected',
  },
  3: {
    label: 'DEFCON 3',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/40',
    glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
    icon: 'heroicons:bolt-20-solid',
    description: 'Increased Readiness - Elevated Threat Level',
  },
  4: {
    label: 'DEFCON 4',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    icon: 'heroicons:shield-check-20-solid',
    description: 'Normal Readiness - Routine Monitoring',
  },
  5: {
    label: 'DEFCON 5',
    color: 'text-green-500',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/40',
    glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    icon: 'heroicons:check-circle-20-solid',
    description: 'Lowest Alert - Minimal Threats',
  },
};
