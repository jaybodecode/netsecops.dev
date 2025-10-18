/**
 * Content Generation V2 - Structured News Schema
 * 
 * Based on scripts/content-generation/schemas/publication-unified-zod.ts
 * Schema for structured output from raw news search results
 */

import { z } from 'genkit';

// Source reference schema
export const SourceSchema = z.object({
  url: z.string().describe("Source URL - full article URL"),
  title: z.string().describe("Source article title"),
  friendly_name: z.string().optional().describe(`Optional: FRIENDLY brand/publication name for SEO (e.g., 'The Hacker News', 'BleepingComputer', 'Unit 42', 'Cisco Talos', 'CrowdStrike', 'Mandiant', 'SecurityWeek', 'Dark Reading').
    
    IMPORTANT: Use recognizable BRAND NAMES that people search for, NOT domain names.
    Examples:
    - thehackernews.com → "The Hacker News"
    - bleepingcomputer.com → "BleepingComputer"
    - unit42.paloaltonetworks.com → "Unit 42"
    - blog.talosintelligence.com → "Cisco Talos"
    - www.crowdstrike.com/blog → "CrowdStrike"
    - cloud.google.com/blog/topics/threat-intelligence → "Google Threat Intelligence"
    - securityaffairs.com → "Security Affairs"
    - darkreading.com → "Dark Reading"`),
  website: z.string().optional().describe("Optional: Source website domain for backward compatibility (e.g., 'bleepingcomputer.com', 'thehackernews.com')"),
  date: z.string().optional().describe("Optional: Original publication date from source in YYYY-MM-DD format if available")
});

// Event timeline schema
export const EventSchema = z.object({
  datetime: z.string().describe("The date and/or time of the event in ISO 8601 format"),
  summary: z.string().describe("A concise summary description of what happened in this event")
});

// MITRE ATT&CK technique schema
export const MITRETechniqueSchema = z.object({
  id: z.string().describe("MITRE ATT&CK technique ID (e.g., T1059.001, T1078.002)"),
  name: z.string().describe("Friendly name of the technique (e.g., 'PowerShell', 'Valid Accounts')"),
  tactic: z.string().optional().describe("Optional: Associated MITRE ATT&CK tactic if known (e.g., 'Execution', 'Privilege Escalation')")
});

// D3FEND Technique (used within MITRE Mitigation)
export const D3FENDTechniqueSchema = z.object({
  id: z.string().describe("D3FEND Technique ID (e.g., D3-MFA, D3-NTA, D3-SU)"),
  name: z.string().describe("D3FEND Technique name (e.g., 'Multi-factor Authentication', 'Network Traffic Analysis', 'Software Update')"),
  url: z.string().describe("D3FEND URL (e.g., 'https://d3fend.mitre.org/technique/d3f:Multi-factorAuthentication')")
});

// MITRE ATT&CK mitigation schema
export const MITREMitigationSchema = z.object({
  id: z.string().describe("MITRE ATT&CK Mitigation ID in format M#### (e.g., M0801, M1047, M1032). Use Enterprise mitigations from https://attack.mitre.org/mitigations/enterprise/ or ICS mitigations from https://attack.mitre.org/mitigations/ics/ as applicable."),
  name: z.string().describe("Friendly name of the mitigation (e.g., 'Application Developer Guidance', 'Audit', 'Multi-factor Authentication')"),
  domain: z.enum(['enterprise', 'ics', 'mobile']).optional().describe("Optional: MITRE domain for this mitigation. Use 'enterprise' for general IT systems, 'ics' for industrial control systems, 'mobile' for mobile devices. Note: Some IDs exist in multiple domains."),
  description: z.string().optional().describe("Optional: Brief description of how this mitigation applies to the threat/vulnerability discussed"),
  d3fend_techniques: z.array(D3FENDTechniqueSchema).optional().describe(`Optional: Map this MITRE Mitigation to D3FEND defensive techniques using the lookup table below.
    
    MITRE ATT&CK Mitigation → D3FEND Mapping Table:
    
    M1015 - Active Directory Configuration:
      - D3-ANCI: Authentication Cache Invalidation (https://d3fend.mitre.org/technique/d3f:AuthenticationCacheInvalidation)
      - D3-DTP: Domain Trust Policy (https://d3fend.mitre.org/technique/d3f:DomainTrustPolicy)
      - D3-UAP: User Account Permissions (https://d3fend.mitre.org/technique/d3f:UserAccountPermissions)
    
    M1018 - User Account Management:
      - D3-LFP: Local File Permissions (https://d3fend.mitre.org/technique/d3f:LocalFilePermissions)
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
      - D3-SCP: System Configuration Permissions (https://d3fend.mitre.org/technique/d3f:SystemConfigurationPermissions)
    
    M1020 - SSL/TLS Inspection:
      - D3-NTA: Network Traffic Analysis (https://d3fend.mitre.org/technique/d3f:NetworkTrafficAnalysis)
    
    M1021 - Restrict Web-Based Content:
      - D3-DNSAL: DNS Allowlisting (https://d3fend.mitre.org/technique/d3f:DNSAllowlisting)
      - D3-DNSDL: DNS Denylisting (https://d3fend.mitre.org/technique/d3f:DNSDenylisting)
      - D3-FA: File Analysis (https://d3fend.mitre.org/technique/d3f:FileAnalysis)
      - D3-ITF: Inbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:InboundTrafficFiltering)
      - D3-NTA: Network Traffic Analysis (https://d3fend.mitre.org/technique/d3f:NetworkTrafficAnalysis)
      - D3-OTF: Outbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:OutboundTrafficFiltering)
      - D3-UA: URL Analysis (https://d3fend.mitre.org/technique/d3f:URLAnalysis)
    
    M1022 - Restrict File and Directory Permissions:
      - D3-LFP: Local File Permissions (https://d3fend.mitre.org/technique/d3f:LocalFilePermissions)
    
    M1024 - Restrict Registry Permission:
      - D3-SCP: System Configuration Permissions (https://d3fend.mitre.org/technique/d3f:SystemConfigurationPermissions)
    
    M1025 - Privileged Process Integrity:
      - D3-BA: Bootloader Authentication (https://d3fend.mitre.org/technique/d3f:BootloaderAuthentication)
      - D3-DLIC: Driver Load Integrity Checking (https://d3fend.mitre.org/technique/d3f:DriverLoadIntegrityChecking)
      - D3-PSEP: Process Segment Execution Prevention (https://d3fend.mitre.org/technique/d3f:ProcessSegmentExecutionPrevention)
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
    
    M1026 - Privileged Account Management:
      - D3-DAM: Domain Account Monitoring (https://d3fend.mitre.org/technique/d3f:DomainAccountMonitoring)
      - D3-LAM: Local Account Monitoring (https://d3fend.mitre.org/technique/d3f:LocalAccountMonitoring)
      - D3-SPP: Strong Password Policy (https://d3fend.mitre.org/technique/d3f:StrongPasswordPolicy)
    
    M1027 - Password Policies:
      - D3-OTP: One-time Password (https://d3fend.mitre.org/technique/d3f:One-timePassword)
      - D3-SPP: Strong Password Policy (https://d3fend.mitre.org/technique/d3f:StrongPasswordPolicy)
    
    M1028 - Operating System Configuration:
      - D3-PH: Platform Hardening (https://d3fend.mitre.org/technique/d3f:PlatformHardening)
    
    M1030 - Network Segmentation:
      - D3-BDI: Broadcast Domain Isolation (https://d3fend.mitre.org/technique/d3f:BroadcastDomainIsolation)
      - D3-ET: Encrypted Tunnels (https://d3fend.mitre.org/technique/d3f:EncryptedTunnels)
      - D3-ISVA: Inbound Session Volume Analysis (https://d3fend.mitre.org/technique/d3f:InboundSessionVolumeAnalysis)
      - D3-ITF: Inbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:InboundTrafficFiltering)
    
    M1031 - Network Intrusion Prevention:
      - D3-ITF: Inbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:InboundTrafficFiltering)
      - D3-NTA: Network Traffic Analysis (https://d3fend.mitre.org/technique/d3f:NetworkTrafficAnalysis)
      - D3-OTF: Outbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:OutboundTrafficFiltering)
    
    M1032 - Multi-factor Authentication:
      - D3-MFA: Multi-factor Authentication (https://d3fend.mitre.org/technique/d3f:Multi-factorAuthentication)
    
    M1033 - Limit Software Installation:
      - D3-EAL: Executable Allowlisting (https://d3fend.mitre.org/technique/d3f:ExecutableAllowlisting)
      - D3-EDL: Executable Denylisting (https://d3fend.mitre.org/technique/d3f:ExecutableDenylisting)
    
    M1034 - Limit Hardware Installation:
      - D3-IOPR: IO Port Restriction (https://d3fend.mitre.org/technique/d3f:IOPortRestriction)
    
    M1035 - Limit Access to Resource Over Network:
      - D3-NI: Network Isolation (https://d3fend.mitre.org/technique/d3f:NetworkIsolation)
    
    M1036 - Account Use Policies:
      - D3-AL: Account Locking (https://d3fend.mitre.org/technique/d3f:AccountLocking)
      - D3-ANCI: Authentication Cache Invalidation (https://d3fend.mitre.org/technique/d3f:AuthenticationCacheInvalidation)
      - D3-ANET: Authentication Event Thresholding (https://d3fend.mitre.org/technique/d3f:AuthenticationEventThresholding)
    
    M1037 - Filter Network Traffic:
      - D3-NI: Network Isolation (https://d3fend.mitre.org/technique/d3f:NetworkIsolation)
    
    M1038 - Execution Prevention:
      - D3-DLIC: Driver Load Integrity Checking (https://d3fend.mitre.org/technique/d3f:DriverLoadIntegrityChecking)
      - D3-EAL: Executable Allowlisting (https://d3fend.mitre.org/technique/d3f:ExecutableAllowlisting)
      - D3-EDL: Executable Denylisting (https://d3fend.mitre.org/technique/d3f:ExecutableDenylisting)
      - D3-PSEP: Process Segment Execution Prevention (https://d3fend.mitre.org/technique/d3f:ProcessSegmentExecutionPrevention)
    
    M1039 - Environment Variable Permissions:
      - D3-ACH: Application Configuration Hardening (https://d3fend.mitre.org/technique/d3f:ApplicationConfigurationHardening)
      - D3-SFA: System File Analysis (https://d3fend.mitre.org/technique/d3f:SystemFileAnalysis)
    
    M1040 - Behavior Prevention on Endpoint:
      - D3-ANET: Authentication Event Thresholding (https://d3fend.mitre.org/technique/d3f:AuthenticationEventThresholding)
      - D3-AZET: Authorization Event Thresholding (https://d3fend.mitre.org/technique/d3f:AuthorizationEventThresholding)
      - D3-JFAPA: Job Function Access Pattern Analysis (https://d3fend.mitre.org/technique/d3f:JobFunctionAccessPatternAnalysis)
      - D3-RAPA: Resource Access Pattern Analysis (https://d3fend.mitre.org/technique/d3f:ResourceAccessPatternAnalysis)
      - D3-SDA: Session Duration Analysis (https://d3fend.mitre.org/technique/d3f:SessionDurationAnalysis)
      - D3-UDTA: User Data Transfer Analysis (https://d3fend.mitre.org/technique/d3f:UserDataTransferAnalysis)
      - D3-UGLPA: User Geolocation Logon Pattern Analysis (https://d3fend.mitre.org/technique/d3f:UserGeolocationLogonPatternAnalysis)
      - D3-WSAA: Web Session Activity Analysis (https://d3fend.mitre.org/technique/d3f:WebSessionActivityAnalysis)
    
    M1041 - Encrypt Sensitive Information:
      - D3-DENCR: Disk Encryption (https://d3fend.mitre.org/technique/d3f:DiskEncryption)
      - D3-ET: Encrypted Tunnels (https://d3fend.mitre.org/technique/d3f:EncryptedTunnels)
      - D3-FE: File Encryption (https://d3fend.mitre.org/technique/d3f:FileEncryption)
      - D3-MENCR: Message Encryption (https://d3fend.mitre.org/technique/d3f:MessageEncryption)
    
    M1042 - Disable or Remove Feature or Program:
      - D3-ACH: Application Configuration Hardening (https://d3fend.mitre.org/technique/d3f:ApplicationConfigurationHardening)
      - D3-EDL: Executable Denylisting (https://d3fend.mitre.org/technique/d3f:ExecutableDenylisting)
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
    
    M1043 - Credential Access Protection:
      - D3-HBPI: Hardware-based Process Isolation (https://d3fend.mitre.org/technique/d3f:Hardware-basedProcessIsolation)
    
    M1044 - Restrict Library Loading:
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
    
    M1045 - Code Signing:
      - D3-DLIC: Driver Load Integrity Checking (https://d3fend.mitre.org/technique/d3f:DriverLoadIntegrityChecking)
      - D3-EAL: Executable Allowlisting (https://d3fend.mitre.org/technique/d3f:ExecutableAllowlisting)
      - D3-SBV: Service Binary Verification (https://d3fend.mitre.org/technique/d3f:ServiceBinaryVerification)
    
    M1046 - Boot Integrity:
      - D3-BA: Bootloader Authentication (https://d3fend.mitre.org/technique/d3f:BootloaderAuthentication)
      - D3-TBI: TPM Boot Integrity (https://d3fend.mitre.org/technique/d3f:TPMBootIntegrity)
    
    M1047 - Audit:
      - D3-DAM: Domain Account Monitoring (https://d3fend.mitre.org/technique/d3f:DomainAccountMonitoring)
      - D3-LAM: Local Account Monitoring (https://d3fend.mitre.org/technique/d3f:LocalAccountMonitoring)
      - D3-SFA: System File Analysis (https://d3fend.mitre.org/technique/d3f:SystemFileAnalysis)
    
    M1048 - Application Isolation and Sandboxing:
      - D3-DA: Dynamic Analysis (https://d3fend.mitre.org/technique/d3f:DynamicAnalysis)
      - D3-HBPI: Hardware-based Process Isolation (https://d3fend.mitre.org/technique/d3f:Hardware-basedProcessIsolation)
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
    
    M1049 - Antivirus/Antimalware:
      - D3-FCR: File Content Rules (https://d3fend.mitre.org/technique/d3f:FileContentRules)
      - D3-FH: File Hashing (https://d3fend.mitre.org/technique/d3f:FileHashing)
      - D3-PA: Process Analysis (https://d3fend.mitre.org/technique/d3f:ProcessAnalysis)
    
    M1050 - Exploit Protection:
      - D3-SSC: Shadow Stack Comparisons (https://d3fend.mitre.org/technique/d3f:ShadowStackComparisons)
      - D3-AH: Application Hardening (https://d3fend.mitre.org/technique/d3f:ApplicationHardening)
      - D3-EHPV: Exception Handler Pointer Validation (https://d3fend.mitre.org/technique/d3f:ExceptionHandlerPointerValidation)
      - D3-ITF: Inbound Traffic Filtering (https://d3fend.mitre.org/technique/d3f:InboundTrafficFiltering)
    
    M1051 - Update Software:
      - D3-SU: Software Update (https://d3fend.mitre.org/technique/d3f:SoftwareUpdate)
    
    M1052 - User Account Control:
      - D3-SCF: System Call Filtering (https://d3fend.mitre.org/technique/d3f:SystemCallFiltering)
    
    M1054 - Software Configuration:
      - D3-ACH: Application Configuration Hardening (https://d3fend.mitre.org/technique/d3f:ApplicationConfigurationHardening)
      - D3-CP: Certificate Pinning (https://d3fend.mitre.org/technique/d3f:CertificatePinning)
    
    M1056 - Pre-compromise:
      - D3-DE: Decoy Environment (https://d3fend.mitre.org/technique/d3f:DecoyEnvironment)
      - D3-DO: Decoy Object (https://d3fend.mitre.org/technique/d3f:DecoyObject)
    
    NOTE: Not all MITRE mitigations have D3FEND mappings. If no mapping exists for your mitigation ID, leave this field empty.`)
});

// Impact scope schema
export const ImpactScopeSchema = z.object({
  geographic_scope: z.enum(['global', 'regional', 'national', 'local']).describe("Geographic scope of impact. Choose based on: Global (worldwide/multi-continent), Regional (specific region like 'Asia-Pacific', 'Europe'), National (specific country), Local (city/state/specific locations)"),
  
  countries_affected: z.array(z.string()).optional().describe("ONLY if explicitly mentioned: Specific countries affected or targeted. Use standard country names (e.g., 'United States', 'United Kingdom', 'France'). Omit if not specified in articles."),
  
  industries_affected: z.array(z.enum([
    'Healthcare', 
    'Finance', 
    'Energy', 
    'Government', 
    'Technology', 
    'Manufacturing', 
    'Retail', 
    'Education',
    'Transportation',
    'Telecommunications',
    'Critical Infrastructure',
    'Defense',
    'Legal Services',
    'Media and Entertainment',
    'Hospitality',
    'Other'
  ])).optional().describe("PRIORITIZE THIS: Industries/sectors affected or targeted. Select ALL applicable from list. This is more important than individual company names - focus on sector-wide impact."),
  
  companies_affected: z.array(z.string()).optional().describe("ONLY for major named victim organizations explicitly mentioned in breach/attack context. Do NOT duplicate entities[] array - only include if company is a VICTIM/TARGET, not just mentioned. Omit if impact is sector-wide rather than specific companies."),
  
  people_affected_estimate: z.string().optional().describe("Estimated number or range of individuals affected if mentioned (e.g., '10,000+', '500-1000 users', 'millions of customers', '50 employees'). Include only if articles specify or you can reasonably estimate from breach scope."),
  
  governments_affected: z.array(z.string()).optional().describe("ONLY for government entities explicitly targeted/breached. Do NOT duplicate entities[] array. Use specific names (e.g., 'U.S. Department of Defense', 'UK National Health Service'). Omit if just general 'government sector' - use industries_affected instead."),
  
  other_affected: z.array(z.string()).optional().describe("Any other significant affected parties not covered above (e.g., 'critical infrastructure operators', 'cloud service customers', 'open-source software users'). Use for categorical groups, not specific entity names.")
});

// CVE vulnerability schema
export const CVESchema = z.object({
  id: z.string().describe("CVE identifier in format CVE-YYYY-NNNNN"),
  cvss_score: z.number().min(0).max(10).optional().describe("Optional: CVSS score (0-10) if available in the article"),
  cvss_version: z.string().optional().describe("Optional: CVSS version (e.g., '3.1', '2.0') if available"),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional().describe("Optional: Severity level if mentioned in the article"),
  kev: z.boolean().optional().describe("Optional: True if mentioned as a Known Exploited Vulnerability (KEV) by CISA")
});

// Entity schema (companies, threat actors, products, etc.)
export const EntitySchema = z.object({
  name: z.string().describe("The specific name of the entity (e.g., 'Microsoft', 'APT29', 'Cobalt Strike', 'FBI')"),
  type: z.enum([
    'vendor',
    'company',
    'product',
    'malware',
    'threat_actor',
    'person',
    'government_agency',
    'security_organization',
    'technology',
    'other'
  ]).describe("The type/category of this entity"),
  url: z.string().url().optional().describe("Optional: Authoritative HTTPS URL for this entity. Use official sources (vendor sites, MITRE ATT&CK, .gov sites) or Wikipedia for well-known entities. See URL guidelines in main instructions.")
});

// IOC schema - Indicators of Compromise from the article
export const IOCSchema = z.object({
  type: z.enum([
    'ip_address_v4',
    'ip_address_v6',
    'domain',
    'url',
    'file_hash_md5',
    'file_hash_sha1',
    'file_hash_sha256',
    'email_address',
    'file_name',
    'file_path',
    'registry_key',
    'mutex',
    'user_agent',
    'certificate_fingerprint',
    'hex_pattern',
    'string_pattern',
    'byte_sequence',
    'source_port',
    'destination_port',
    'protocol',
    'other'
  ]).describe("Type of indicator. Use ip_address_v4/v6 to distinguish IP versions. Pattern types (hex_pattern, string_pattern, byte_sequence) only if article contains technical malware analysis."),
  value: z.string().describe("The actual indicator value. For patterns, include the exact hex/string/byte sequence from the article."),
  description: z.string().optional().describe("Optional: Context about this IOC (e.g., 'C2 server', 'Malicious payload', 'Dropper filename', 'Malware signature hex bytes')"),
  source: z.string().optional().describe("Optional: Which source article mentioned this IOC")
});

// Cyber Observable schema - MITRE-aligned observables for detection/hunting
export const CyberObservableSchema = z.object({
  type: z.enum([
    'domain',
    'url_pattern',
    'file_name',
    'file_path',
    'registry_key',
    'process_name',
    'service_name',
    'port',
    'protocol',
    'api_endpoint',
    'log_source',
    'event_id',
    'certificate_subject',
    'user_account_pattern',
    'command_line_pattern',
    'network_traffic_pattern',
    'hex_pattern',
    'string_pattern',
    'byte_sequence',
    'other'
  ]).describe("Type of observable. Pattern types (hex_pattern, string_pattern, byte_sequence) for YARA rule generation when you have knowledge of malware signatures."),
  value: z.string().describe("The observable value or pattern. For URL/file/process patterns, use specific values (e.g., '/admin/config.php', 'svchost.exe'). For hex patterns, use space-separated hex bytes."),
  description: z.string().describe("Explanation of this observable and how it relates to the article (e.g., 'Default SonicWall SSL-VPN login URL', 'SharePoint config file that may be modified in exploitation', 'Malware string pattern for YARA detection')"),
  context: z.string().describe("Detection/hunting context: where to look for this observable (e.g., 'Web proxy logs', 'Windows Event ID 4688', 'File integrity monitoring', 'Memory scanning with YARA')"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level that this observable is relevant for detection/hunting based on the article context and your expert knowledge")
});

// MITRE D3FEND Countermeasure schema - Defensive techniques and recommendations
// D3FEND countermeasure schema with URL and MITRE Mitigation mapping
export const D3FENDCountermeasureSchema = z.object({
  technique_id: z.string().describe("MITRE D3FEND technique ID (e.g., D3-PH, D3-NTA, D3-AL)"),
  technique_name: z.string().describe("D3FEND technique name (e.g., 'Process Termination', 'Network Traffic Analysis', 'Application Hardening')"),
  url: z.string().describe("D3FEND technique URL (e.g., 'https://d3fend.mitre.org/technique/d3f:NetworkTrafficAnalysis')"),
  mitre_mitigation_id: z.string().optional().describe("Optional: MITRE ATT&CK Mitigation ID that this D3FEND technique maps to (e.g., 'M1047', 'M1032'). This provides traceability to the MITRE framework."),
  recommendation: z.string().describe(`Detailed tactical recommendation on how to apply this specific D3FEND defensive technique in the context of this article's threat/vulnerability (200-400 words).

CRITICAL: Tailor this recommendation to the SPECIFIC threat, attack, or vulnerability discussed in THIS article. Generic advice is not acceptable.

Your recommendation should include:
1. **Context-Specific Application**: How does this D3FEND technique specifically address the threat/attack/vulnerability in this article? Reference specific products, attack vectors, or vulnerabilities mentioned.

2. **Implementation Details**: Provide actionable technical guidance:
   - Specific tools, technologies, or platforms to use
   - Configuration steps or settings to apply
   - Where in the environment to deploy (e.g., "on perimeter firewalls", "at domain controllers", "on developer workstations")
   - Priority assets to protect first (e.g., "internet-facing systems", "build servers", "critical databases")

3. **Detection/Response Context**: How does this technique help detect or respond to this specific threat?
   - What should security teams monitor or alert on?
   - What log sources or telemetry are needed?
   - What baseline should be established?

4. **Practical Considerations**: Address real-world implementation:
   - Resource requirements (staffing, tools, budget)
   - Deployment timeline (immediate vs. strategic)
   - Potential operational impact or false positives
   - Integration with existing security stack

Example for Network Traffic Analysis (D3-NTA) in context of F5 BIG-IP breach:
"Deploy network monitoring solutions to baseline and analyze all traffic to and from F5 BIG-IP management interfaces. Given the threat actor's use of Yandex Cloud for exfiltration in similar campaigns, configure alerts for large uploads to cloud storage services from build servers or code repositories. Use NetFlow analysis or a network TAP to capture traffic patterns without impacting BIG-IP performance. Prioritize monitoring on internet-facing BIG-IP devices and those protecting critical applications. Establish a baseline of normal management traffic (typically only to internal jump hosts) and alert on any deviations, especially connections to external IPs or unusual data volumes. This technique directly addresses the supply chain attack vector by detecting unauthorized data exfiltration attempts before malicious code can be injected into software updates."

Target length: 200-400 words of specific, actionable guidance tailored to this article's context.`)
});

// Article schema - comprehensive structured output
export const ArticleSchema = z.object({
  // Core Identity
  id: z.string().describe("Article identifier (system will replace with UUID)"),
  slug: z.string().describe("URL-friendly slug based to be SEO optimsied and constructed as the most probable title to carry forware is story continues over more days (lowercase, hyphens, no special characters)"),

  // Headlines
  headline: z.string().describe("Catchy new Article headline title - keep it concise and impactful"),
  title: z.string().describe("Article title - appropriate for news story - highlight key entities and sources"),

  // Content
  summary: z.string().describe("Article summary highlighting key points and entities. Target 150-300 words. Include who, what, when, where, and impact."),
  
  full_report: z.string().describe(`Comprehensive article with all relevant details. Markdown Format. Guidelines below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: ASSUME THE ROLE OF AN EXPERT CYBERSECURITY ANALYST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are NOT just summarizing articles. You are an experienced cybersecurity analyst with deep 
technical knowledge providing expert analysis, actionable recommendations, and threat intelligence.

CORE PRINCIPLES:
1. Synthesize information from articles AND your expert knowledge
2. Provide tactical recommendations based on best practices and industry standards
3. Generate detection strategies and observables even if not explicitly in the articles
4. Think like a defender: "How would I detect this? What logs should I check?"
5. Add value beyond what's in the source material

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTITY URL GUIDELINES (For entities[] array):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When generating entities[], include authoritative HTTPS URLs where possible.

CRITICAL: Only include URLs you KNOW are valid based on your training data.
If uncertain whether a URL exists, OMIT it completely. It's better to have no URL than a broken one.

1. Threat Actors (try these sources in order):
   - FIRST: MITRE ATT&CK Groups if you know the Group ID? Use https://attack.mitre.org/groups/GXXXX/
     Examples from your knowledge: APT28 (G0007), Lazarus Group (G0032), APT29 (G0016), APT41 (G0096)
   - SECOND: Malpedia Actors if you know it exists? Use https://malpedia.caad.fkie.fraunhofer.de/actor/actor_name
     Format actor_name as lowercase with underscores (e.g., apt28, lazarus_group, fancy_bear)
     Only use if you're confident this actor exists in Malpedia based on your training
   - THIRD: Wikipedia or other authoritative sources only if very notable and well-documented
   - If uncertain about any of the above, OMIT URL (this is correct for brand new threat actors)

2. Malware Families (try these sources in order):
   - FIRST: MITRE ATT&CK Software if you know the Software ID? Use https://attack.mitre.org/software/SXXXX/
     Examples from your knowledge: Emotet (S0367), Cobalt Strike (S0154), Mimikatz (S0002)
   - SECOND: Malpedia Families if you know it exists? Use https://malpedia.caad.fkie.fraunhofer.de/details/family_name
     Format family_name as lowercase (e.g., emotet, lockbit, blackcat, cobaltstrike)
     Only use if you're confident this family exists in Malpedia based on your training
   - THIRD: Wikipedia only for very well-known, historically significant malware families
   - If uncertain about any of the above, OMIT URL (this is correct for novel/custom malware)

3. Tools/Software (legitimate security tools, try these sources in order):
   - FIRST: MITRE ATT&CK Software if you know the Software ID? Use https://attack.mitre.org/software/SXXXX/
     Examples: Mimikatz (S0002), PowerShell Empire (S0363), PsExec (S0029)
   - SECOND: Wikipedia for well-known, widely-used tools
   - THIRD: Official project pages only if you know the exact URL
   - If uncertain, OMIT URL

4. Vendors/Companies: Official security page or homepage only if you know the exact URL
   - Examples: https://www.microsoft.com/security, https://www.sonicwall.com

5. Products: Official product pages from vendor sites only if you know the exact URL
   - Examples: https://www.microsoft.com/en-us/microsoft-365/exchange/

6. Government Agencies: Official .gov sites (these are stable)
   - Examples: https://www.cisa.gov, https://www.fbi.gov, https://www.nsa.gov

7. Technologies: Wikipedia for common, well-established technical terms
   - Examples: VPN, MFA, SSL/TLS, Active Directory

KNOWLEDGE CUTOFF REMINDER:
Your training data has a cutoff date. URLs you include should be based on knowledge from that training.
For threats/malware that emerged AFTER your training cutoff, it's CORRECT and EXPECTED to omit URLs.
This is not a failure - it means the entity is too new to have established authoritative references yet.

QUALITY OVER QUANTITY:
- A missing URL is better than a wrong/broken URL
- Only include URLs you're confident about (>90% certainty)
- When in doubt, leave it out

PRIORITY SUMMARY:
- Threat Actors: MITRE ATT&CK → Malpedia → Other (only if confident)
- Malware Families: MITRE ATT&CK → Malpedia → Other (only if confident)
- Tools/Software: MITRE ATT&CK → Wikipedia → Official Sites (only if confident)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Structure the content appropriately based on article category:

For Threat/Attack articles (Ransomware, Malware, Data Breach, Cyberattack):
  - Executive Summary: High-level overview for decision makers (100-200 words)
  - Threat Overview: What happened, who's affected, attack vector (200-400 words)
  - Technical Analysis: TTPs, MITRE ATT&CK mappings, technical indicators (300-600 words)
  - Impact Assessment: Business impact, affected parties, damage scope (200-400 words)
    * If articles lack business impact details, provide expert analysis based on:
      - Typical organizational dependencies on affected systems
      - Industry-standard recovery timeframes
      - Common financial/operational impact patterns
      - Regulatory implications (GDPR, HIPAA, etc.)
  - IOCs: List of indicators if available (IPs, domains, hashes, file paths)
    * List only IOCs explicitly mentioned in source articles
    * Use markdown table format: | Type | Value | Description |
  - Cyber Observables for Detection: Generate hunting indicators based on your knowledge
    * Generate relevant observables based on the attack/threat discussed
    * Include: known service URLs, default file paths, common process names, registry keys
    * Specify where to look: log sources, EDR queries, SIEM searches
    * Example: "For SonicWall VPN exploitation, monitor for /cgi-bin/viewcert requests in web logs"
  - Detection & Response: Don't just repeat article content
    * Provide specific detection strategies based on your knowledge of the threat
    * Include: SIEM queries, EDR detection rules, network monitoring approaches
    * Reference relevant log sources (Windows Event Logs, Syslog, etc.)
    * Suggest threat hunting procedures even if not in articles (200-400 words)
    * **Reference D3FEND techniques**: Link defensive detection/analysis techniques
  - Mitigation: Tactical and strategic controls
    * Beyond patches: configuration hardening, compensating controls, architectural changes
    * Prioritize based on effectiveness and implementation difficulty
    * Include both immediate actions and long-term improvements (200-400 words)
    * **Reference D3FEND techniques**: Mention D3FEND countermeasure types (Hardening, Isolation, etc.)

For Vulnerability articles (CVE disclosures, Zero-days):
  - Executive Summary: CVE overview, severity, affected products (100-200 words)
  - Vulnerability Details: Technical description, attack vector, prerequisites (200-400 words)
  - Affected Systems: Products, versions, configurations impacted (150-300 words)
  - Exploitation Status: In-the-wild exploitation, PoC availability (150-300 words)
  - Impact Assessment: If not detailed in articles, assess based on your knowledge
    * Assess realistic business impact based on vulnerability characteristics
    * Consider: exploitability, attack complexity, privileges required, user interaction
    * Evaluate cascading risks and potential attack chains (150-250 words)
  - Cyber Observables for Detection: Generate indicators to hunt based on your knowledge
    * Known vulnerable file versions, configuration indicators, service characteristics
    * Log patterns that might indicate exploitation attempts
    * Network signatures or API calls associated with the vulnerability
  - Detection Methods: How to identify vulnerable systems
    * Asset inventory queries, version checking commands, vulnerability scanner rules
    * Log analysis approaches for detecting exploitation attempts (200-300 words)
    * **Reference D3FEND detection techniques**: File Analysis, Network Traffic Analysis, etc.
  - Remediation Steps: Patches, workarounds, mitigation controls (200-400 words)
    * If patches unavailable, provide compensating controls based on your knowledge
    * Include verification steps to confirm successful remediation
    * **Reference D3FEND hardening techniques**: Application Hardening, Configuration Hardening, etc.

For Policy/Compliance/Regulatory articles:
  - Executive Summary: New regulation/policy overview (100-200 words)
  - Regulatory Details: Full requirements, scope, jurisdictions (300-500 words)
  - Affected Organizations: Who must comply, industries, size thresholds (200-300 words)
  - Compliance Requirements: Specific obligations, technical controls (300-500 words)
  - Implementation Timeline: Deadlines, phases, milestones (150-250 words)
  - Impact Assessment: Business and operational impacts
    * Resource requirements, budget implications, organizational changes
    * Common compliance gaps and remediation efforts required (200-300 words)
  - Enforcement & Penalties: Non-compliance consequences, enforcement actions (200-300 words)
  - Compliance Guidance: Tactical implementation steps
    * Prioritized action plan based on compliance deadline and organizational maturity
    * Technology solutions, process changes, documentation requirements
    * Best practices from similar regulatory implementations (200-400 words)

For Security Operations/Incident Response articles:
  - Executive Summary: Incident/operation overview (100-200 words)
  - Incident Timeline: Chronological events, key milestones (200-400 words)
  - Response Actions: What was done, by whom, when (300-500 words)
  - Technical Findings: Root cause, attack methods, scope (300-500 words)
  - Detection & Response: How to improve detection
    * Identify detection gaps that allowed this incident
    * Suggest monitoring improvements, alert rules, response playbooks
    * Leverage lessons learned to strengthen security posture (200-400 words)
    * **Reference D3FEND techniques**: User Behavior Analysis, Process Analysis, etc.
  - Lessons Learned: Key takeaways, gaps identified (200-300 words)
  - Mitigation Recommendations: Prevent similar incidents
    * Strategic and tactical recommendations based on incident root causes
    * Include compensating controls, architectural improvements, process changes (200-400 words)
    * **Reference D3FEND countermeasures**: Isolation, Eviction, Hardening techniques

For Critical Patches/Security Updates articles:
  - Executive Summary: Patch overview, urgency level (100-200 words)
  - Vulnerabilities Addressed: CVEs fixed, severity ratings (200-400 words)
  - Affected Products: Software, versions, platforms (150-300 words)
  - Impact Assessment: Real-world exploitation risk
    * Evaluate likelihood of exploitation based on CVE characteristics
    * Assess organizational exposure based on common deployment patterns (150-250 words)
  - Patch Details: What's fixed, known issues, dependencies (200-400 words)
  - Deployment Priority: Risk-based prioritization
    * Critical systems first, followed by internet-facing, then internal
    * Consider: exploitation likelihood, asset criticality, business impact (150-250 words)
  - Installation Instructions: How to apply, testing recommendations (200-300 words)
  - Cyber Observables: Pre-patch detection observables based on your knowledge
    * Indicators to identify vulnerable versions in the environment
    * Log queries to detect pre-patch exploitation attempts

Target total length: 1000-2500 words depending on article complexity and category.

MARKDOWN FORMATTING REQUIREMENTS:
- Use ## for section headers (Executive Summary, Threat Overview, etc.)
- Use ### for subsections
- Use **bold** for emphasis on critical terms (e.g., **CVE-2025-12345**, **critical vulnerability**)
- Use bullet lists (- item) for IOCs, affected products, recommendations
- Use numbered lists (1. step) for attack chains, mitigation steps, detection procedures
- Use inline code (\`backticks\`) for: technical terms, file paths, commands, registry keys, IP addresses, domains
- Use code blocks (\`\`\`language ... \`\`\`) for: exploit code, YARA rules, detection rules, configuration snippets
- Use > blockquotes for important warnings or key insights
- Use horizontal rules (---) to separate major sections
- Use tables (| header |) for: CVSS breakdowns, affected version matrices, IOC listings, observable catalogs

MARKDOWN LINKING (SEO CRITICAL - Target 10-15 total links):
- Link MITRE techniques using format: [\`T1190 - Technique Name\`](https://attack.mitre.org/techniques/T1190/)
- Link entities that have URLs in the entities[] array on FIRST mention: **[Entity Name](url)**
- Link 2-4 key technical terms to Wikipedia/NIST (e.g., **[MFA](https://nist.gov/...)**, **[RaaS](https://en.wikipedia.org/...)**)
- Use proper markdown syntax: [text](url)`),

  // Social Media
  // Social Media
  // TODO: Convert to array for Step 2.5 (generate-twitter-posts.ts)
  // Future: twitter_posts: z.array(z.string()).max(7)
  twitter_post: z.string().describe(`Generate Twitter thread content for this article (will be split into 2-7 tweets in Step 2.5).
    
    FUTURE ARCHITECTURE (Step 2.5 - Dedicated Twitter Generation Script):
    This will become an ARRAY of 2-7 individual tweets, each standing alone but part of a coherent thread.
    Script will prepend "🚨 BREAKING: " or "📢 UPDATE: " automatically based on article.isUpdate field.
    
    CURRENT TEMPORARY FORMAT (Single String - Simple):
    - Maximum 228 characters (reserves 15 chars for "🚨 BREAKING: " or "📢 UPDATE: " prefix)
    - Include 1-3 emojis (⚠️, ✅, 🔥, 🏭, etc.)
    - Include 2-3 hashtags focusing on NEW terms not in tweet text
    - Write in urgent, newsworthy style
    - Front-load key information
    - Target 215-228 chars
    
    FUTURE MULTI-TWEET REQUIREMENTS (When converted to array in Step 2.5):
    
    Structure:
    - Generate 2-7 tweets per article (based on story complexity)
    - Each tweet is 200-270 chars (leaves room for position markers if needed)
    - Each tweet must STAND ALONE (complete thought, actionable, searchable)
    - Thread tells coherent story but each tweet is independently valuable
    
    Hashtag Strategy (2-4 hashtags per tweet):
    - NEVER hashtag words already in the tweet text
    - Prioritize searchable terms: CVE IDs, product names, threat actor aliases, affected companies
    - Distribute hashtags across tweets (don't repeat same hashtags in every tweet)
    - Tweet 1: Primary entities (#CVE202512345, #Windows, #CISA)
    - Tweet 2: Technical/impact (#Healthcare, #Finance, #RCE)
    - Tweet 3+: Action/related (#PatchNow, #ThreatIntel, specific vendor names)
    
    Content Distribution Pattern:
    - Tweet 1: Hook + Core news (who, what, when) + 2-3 specific hashtags
    - Tweet 2: Technical details (how, CVEs, attack vectors) + 2-3 technical hashtags
    - Tweet 3: Impact (affected industries, severity, scale) + 2-3 impact hashtags
    - Tweet 4+: Mitigation/IOCs/details + 2-3 action hashtags
    - Final tweet: Link to full article (if not already included)
    
    Examples of GOOD standalone tweets in a thread:
    
    Thread about Microsoft Zero-Days:
    1. "Microsoft patches 4 actively exploited zero-days in October update! Privilege escalation & Secure Boot bypass found in wild. All Windows versions affected. #CVE202512345 #Windows"
    2. "Attackers chaining these flaws for SYSTEM-level access. No user interaction needed. CISA added to KEV catalog - federal agencies ordered to patch. #CISA #KEV"
    3. "Healthcare & finance sectors heavily targeted. 170+ total flaws fixed in Patch Tuesday. Critical updates available via Windows Update. #Healthcare #Finance"
    
    Thread about Ransomware Campaign:
    1. "Qilin ransomware hits 15+ organizations across US, France & Africa. Insurance, healthcare, and government sectors under siege. #Qilin #Ransomware"
    2. "Double extortion tactics: data encrypted + leaked on dark web. Leak site updated daily with new victims. Group using RaaS model. #DataBreach #DarkWeb"
    3. "Check for Cobalt Strike beacons, lateral movement via RDP. Known to abuse ProxyShell vulnerabilities for initial access. #CobaltStrike #ProxyShell"
    
    Key Principles:
    - Each tweet is quotable and shareable on its own
    - Hashtags add NEW search terms not in tweet text
    - Progressive detail: Hook → Technical → Impact → Action
    - Max 7 tweets (keep threads scannable)
    - Vary hashtags across tweets (maximize discovery)
    - Front-load most important info in each tweet
    
    CHARACTER COUNT: Target 215-228 chars per tweet to leave room for formatting.
  
    twitter:card        = "summary_large_image". ?? chars
    twitter:title       = "Article Headline"
    twitter:description = "Tweet text (first 200 chars)..."
    twitter:image       = "https://cyber.netsecops.io/images/og-image/slug.png"
    twitter:image:alt   = "Article Headline"
    og:url              = "https://cyber.netsecops.io/articles/slug"
    og:type             = "article"

    `),

  // SEO
  meta_description: z.string().describe("SEO meta description for this article"),

  // Classification
  category: z.array(z.enum([
    'Ransomware',
    'Malware',
    'Threat Actor',
    'Vulnerability',
    'Data Breach',
    'Phishing',
    'Supply Chain Attack',
    'Cyberattack',
    'Industrial Control Systems',
    'Cloud Security',
    'Mobile Security',
    'IoT Security',
    'Patch Management',
    'Threat Intelligence',
    'Incident Response',
    'Security Operations',
    'Policy and Compliance',
    'Regulatory',
    'Other'
  ])).min(1).max(3).describe("Select 1-3 categories that best describe this article. IMPORTANT: List the MOST PROMINENT/PRIMARY category FIRST, followed by secondary categories. The first category will be used for visual representations and primary classification."),

  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']).describe(`
    Determine severity based on impact and urgency:
    - CRITICAL: Zero-day exploits, active widespread attacks on critical infrastructure
    - HIGH: Ransomware campaigns, significant data breaches, active exploitation
    - MEDIUM: New malware discoveries, phishing campaigns, vulnerabilities with patches
    - LOW: Vulnerability disclosures with patches, minor incidents
    - INFORMATIONAL: Security research, best practices, general updates
  `),

  // Structured data arrays
  entities: z.array(EntitySchema).describe("Structured list of specific named entities mentioned in the article. Include companies, threat actors, malware, products, vendors, government agencies, and persons. Do NOT include CVE identifiers."),
  cves: z.array(CVESchema).describe("CVE details if mentioned in the article including score if available"),
  iocs: z.array(IOCSchema).describe("Indicators of Compromise explicitly mentioned in source articles. Include IPs, domains, hashes, file paths, etc. that are confirmed malicious."),
  cyber_observables: z.array(CyberObservableSchema).describe(`Generate cyber observables for threat hunting and detection based on your knowledge.
    
    These are NOT IOCs from articles - these are detection indicators you generate based on:
    - Products/services mentioned (e.g., SonicWall SSL-VPN URLs, SharePoint config paths)
    - Attack techniques discussed (e.g., PowerShell command patterns, registry keys)
    - Infrastructure patterns (e.g., known service ports, API endpoints, log sources)
    - Malware signatures (hex patterns, string patterns, byte sequences) if you have knowledge of the threat
    
    Examples:
    - For SonicWall VPN vulnerability: Domain pattern 'sslvpn.sonicwall.com', URL '/cgi-bin/viewcert'
    - For SharePoint exploit: File path 'C:\\Program Files\\Common Files\\microsoft shared\\Web Server Extensions\\', Process 'w3wp.exe'
    - For Kerberoasting: Event ID 4769, Service name pattern '*$', Log source 'Security Event Log'
    - For malware with known signatures: Hex pattern '4D 5A 90 00 03', String pattern 'Mozilla/4.0 (compatible; MSIE 8.0;' for C2 beaconing
    
    For YARA rule generation: Include hex_pattern, string_pattern, or byte_sequence types when you know malware signatures.
    For STIX 2.1 network-traffic: Include protocol, port types with source/destination context.
    
    Generate 3-15 high-confidence observables that security teams can use for detection/hunting.`),
  sources: z.array(SourceSchema).describe("List of source references"),

  // Events and MITRE
  events: z.array(EventSchema).describe("Chronological events if mentioned in the article"),
  mitre_techniques: z.array(MITRETechniqueSchema).describe("MITRE ATT&CK techniques for this threat/attack. Extract techniques explicitly mentioned in articles AND generate additional relevant techniques based on your expert knowledge of the attack methods described. Include 3-8 most relevant techniques total."),
  mitre_mitigations: z.array(MITREMitigationSchema).describe(`EXPERT-GENERATED MITRE ATT&CK mitigations that address the techniques/threats discussed in this article.
    
    Based on your knowledge and the MITRE ATT&CK techniques identified, recommend 3-10 relevant mitigations from:
    - Enterprise mitigations: https://attack.mitre.org/mitigations/enterprise/ (M0800-M1056)
    - ICS mitigations: https://attack.mitre.org/mitigations/ics/ (M0800-M0948)
    
    IMPORTANT: 
    - Only include mitigations you KNOW exist in MITRE ATT&CK based on your training
    - Many mitigation IDs overlap between Enterprise and ICS (e.g., M0801 exists in both)
    - Prioritize mitigations that directly address the identified techniques
    - Consider both immediate tactical mitigations and strategic controls
    - Use the optional description field to explain how the mitigation applies
    
    Common Enterprise Mitigations (examples from your knowledge):
    - M0801: Antivirus/Antimalware
    - M1047: Audit (logging and monitoring)
    - M1032: Multi-factor Authentication
    - M1049: Antivirus/Antimalware (endpoint protection)
    - M1030: Network Segmentation
    - M1026: Privileged Account Management
    - M1017: User Training
    - M1051: Update Software (patching)
    
    Common ICS Mitigations (examples from your knowledge):
    - M0800: Access Management
    - M0801: Antivirus/Antimalware
    - M0802: Communication Authenticity
    - M0804: Human User Authentication
    - M0807: Network Allowlists/Denylists
    - M0813: Software Process and Device Authentication
    
    Generate mitigations based on article content and techniques identified.`),
  d3fend_countermeasures: z.array(D3FENDCountermeasureSchema).describe(`Generate defensive countermeasures from MITRE D3FEND framework based on your knowledge.
    
    Based on the threat/attack described, identify 3-8 relevant D3FEND defensive techniques from https://d3fend.mitre.org/
    
    D3FEND Categories to consider:
    - Harden (D3-H*): Application Hardening, Credential Hardening, Message Hardening, Platform Hardening
    - Detect (D3-D*): File Analysis, Network Traffic Analysis, Process Analysis, User Behavior Analysis
    - Isolate (D3-I*): Execution Isolation, Network Isolation
    - Deceive (D3-DC*): Decoy Environment, Decoy Object
    - Evict (D3-E*): Process Termination, Connection Termination
    - Restore (D3-R*): File Restoration, Configuration Restoration
    
    For each countermeasure, provide:
    - Technique ID (e.g., D3-PH for Process Heuristics, D3-NTA for Network Traffic Analysis)
    - Technique name from D3FEND
    - Brief tactical recommendation (100-200 words) on how to implement this defense
    
    Example: For ransomware attack, include D3-BA (Backup and Recovery), D3-PH (Process Heuristics), D3-FE (File Encryption)`),

  // Impact and Tags
  impact_scope: ImpactScopeSchema.describe(`Impact scope and scale assessment for this incident/vulnerability.

REQUIRED - Always provide at minimum:
- geographic_scope: Always estimate based on article context (required field)
- industries_affected: If sector/industry targeting is mentioned or inferable

CRITICAL DISTINCTIONS:
- Use entities[] for: Named organizations mentioned in ANY context
- Use impact_scope for: Victims/targets and categorical impact (sectors, scale, geography)

PRIORITIZATION:
1. Geographic scope (WHERE) - Always include
2. Industries affected (WHO by sector) - Include if applicable  
3. Scale estimates (HOW MANY) - Include if mentioned or inferable
4. Specific victims (companies/governments) - Only if explicitly breached/targeted

Examples:
- Ransomware campaign: geographic_scope='global', industries_affected=['Healthcare', 'Finance'], people_affected_estimate='thousands affected across 50+ organizations'
- Product vulnerability: geographic_scope='global', industries_affected=['Technology'], people_affected_estimate='millions of product users'
- Nation-state attack: geographic_scope='national', countries_affected=['United States'], industries_affected=['Government', 'Defense'], governments_affected=['U.S. Department of State']
- Single company breach: geographic_scope='national', industries_affected=['Retail'], companies_affected=['Target Corporation'], people_affected_estimate='110 million customers'`),
  tags: z.array(z.string()).describe("List of cybersecurity-related terms. Do NOT include entity names."),

  // Schema.org & SEO
  article_type: z.enum(['NewsArticle', 'TechArticle', 'Report', 'Analysis', 'Advisory']).default('NewsArticle').describe("Schema.org article type. Default to 'NewsArticle' if not specified."),
  keywords: z.array(z.string()).optional().describe("Optional: Generate 5-10 SEO keywords if time permits"),
  reading_time_minutes: z.number().optional().describe("Optional: Estimated reading time based on full_report length (assume 200 words/min)"),

  // Metadata
  pub_date: z.string().optional().describe("Optional: The original publication date from the source article in YYYY-MM-DD format if explicitly mentioned")
});

// Publication schema - collection of articles
export const CyberAdvisorySchema = z.object({
  pub_id: z.string().describe("Publication identifier (system will replace with UUID)"),
  headline: z.string().describe("Catchy breaking news headline of most prominent articles"),
  summary: z.string().describe("Overall summary of the cybersecurity situation - reference the timeframe covered"),


  total_articles: z.number().describe("Total number of articles in this publication"),

  articles: z.array(ArticleSchema).describe("List of articles included in this advisory"),

  generated_at: z.string().describe("Timestamp when this publication was generated in ISO 8601 format"),

  date_range: z.string().describe("Date range covered by this publication (e.g., '2024-10-13')")
});

// TypeScript types
export type SourceType = z.infer<typeof SourceSchema>;
export type EventType = z.infer<typeof EventSchema>;
export type MITRETechniqueType = z.infer<typeof MITRETechniqueSchema>;
export type MITREMitigationType = z.infer<typeof MITREMitigationSchema>;
export type D3FENDTechniqueType = z.infer<typeof D3FENDTechniqueSchema>;
export type D3FENDCountermeasureType = z.infer<typeof D3FENDCountermeasureSchema>;
export type ImpactScopeType = z.infer<typeof ImpactScopeSchema>;
export type CVEType = z.infer<typeof CVESchema>;
export type EntityType = z.infer<typeof EntitySchema>;
export type IOCType = z.infer<typeof IOCSchema>;
export type CyberObservableType = z.infer<typeof CyberObservableSchema>;
export type ArticleType = z.infer<typeof ArticleSchema>;
export type CyberAdvisoryType = z.infer<typeof CyberAdvisorySchema>;
