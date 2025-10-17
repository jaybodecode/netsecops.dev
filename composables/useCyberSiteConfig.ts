/**
 * Composable for accessing site-wide configuration
 * Includes DEFCON status and other remotely-managed settings
 * Test change to trigger watch modes
 */

import type { SiteConfig, DefconDisplay } from '~/types/site-config';
import { DEFCON_LEVELS } from '~/types/site-config';

/**
 * Default configuration if file cannot be loaded
 */
const DEFAULT_CONFIG: SiteConfig = {
  defcon: {
    level: 5,
    description: 'Lowest Alert',
    lastUpdated: new Date().toISOString(),
    reason: 'No configuration file found - using defaults',
  },
  site: {
    maintenanceMode: false,
    announcementBanner: null,
    features: {
      commentsEnabled: true,
      searchEnabled: true,
      notificationsEnabled: false,
    },
  },
  metadata: {
    version: '1.0.0',
    lastSync: new Date().toISOString(),
  },
};

/**
 * Load site configuration from JSON file
 */
export const useCyberSiteConfig = () => {
  const config = useState<SiteConfig>('siteConfig', () => DEFAULT_CONFIG);
  const loading = useState<boolean>('siteConfigLoading', () => false);
  const error = useState<Error | null>('siteConfigError', () => null);

  /**
   * Fetch the site configuration
   */
  const fetchConfig = async () => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/data/site-config.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load site config: ${response.status}`);
      }

      const data: SiteConfig = await response.json();
      
            
      // Validate DEFCON level is in valid range
      if (data.defcon.level < 1 || data.defcon.level > 5) {
        // Invalid DEFCON level, using default
        data.defcon.level = 5;
      }

      config.value = data;
    } catch (e) {
      // Silent error handling
      error.value = e instanceof Error ? e : new Error('Unknown error');
      // Keep using default config on error
      config.value = DEFAULT_CONFIG;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get display properties for current DEFCON level
   */
  const defconDisplay = computed<DefconDisplay>(() => {
    const level = config.value.defcon.level;
    const displayProps = DEFCON_LEVELS[level];
    
    return {
      level,
      ...displayProps,
    };
  });

  /**
   * Get human-readable time since last update
   */
  const timeSinceUpdate = computed(() => {
    const lastUpdated = new Date(config.value.defcon.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  });

  /**
   * Check if site is in high alert (DEFCON 1 or 2)
   */
  const isHighAlert = computed(() => {
    return config.value.defcon.level <= 2;
  });

  /**
   * Check if site should show critical warnings
   */
  const isCritical = computed(() => {
    return config.value.defcon.level === 1;
  });

  // Auto-fetch on first use (client-side only)
  if (import.meta.client) {
    // Only fetch if we haven't loaded config yet (still using default)
    if (config.value.defcon.level === 5 && config.value.defcon.description === 'Lowest Alert') {
      fetchConfig();
    }
  }

  return {
    config,
    loading,
    error,
    defconDisplay,
    timeSinceUpdate,
    isHighAlert,
    isCritical,
    fetchConfig,
    refresh: fetchConfig,
  };
};
