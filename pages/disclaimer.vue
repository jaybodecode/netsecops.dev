<template>
  <div>
    <!-- SEO -->
    <Head>
      <Title>Disclaimer - CyberNetSec.io</Title>
      <Meta name="description" content="Disclaimer for CyberNetSec.io - Important limitations and disclaimers regarding cybersecurity information and services." />
      <Meta name="robots" content="index, follow" />
    </Head>

    <!-- Layout -->
    <NuxtLayout name="cyber">
      <!-- Header -->
      <CyberHeader 
        title="Disclaimer"
        subtitle="Important limitations and disclaimers"
        :showHomeButton="true"
      />

      <div class="container mx-auto px-4 py-12 max-w-4xl">

        <!-- Content -->
        <div class="mt-12 prose prose-invert prose-purple max-w-none">
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8 space-y-8">
            
            <!-- Critical Warning -->
            <section>
              <div class="bg-red-900/30 border border-red-500/50 rounded-lg p-6 mb-8">
                <div class="flex items-center gap-3 mb-4">
                  <Icon name="heroicons:exclamation-triangle-20-solid" class="w-8 h-8 text-red-400" />
                  <h2 class="text-2xl font-bold text-red-400 m-0">⚠️ CRITICAL CYBERSECURITY DISCLAIMER</h2>
                </div>
                <p class="text-gray-300 text-lg font-semibold leading-relaxed m-0">
                  The cybersecurity information, threat intelligence, vulnerability data, and security recommendations provided on CyberNetSec.io are for educational and informational purposes only. This information should be considered as general information, and users assume full responsibility for its implementation and use.
                </p>
              </div>
            </section>

            <!-- General Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">1. General Disclaimer</h2>
              <p class="text-gray-300 leading-relaxed mb-4">
                The information contained on CyberNetSec.io ("we," "our," or "us") is for general information and educational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the website.
              </p>
              <p class="text-gray-300 leading-relaxed">
                Any reliance you place on such information is therefore strictly at your own risk. In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.
              </p>
            </section>

            <!-- Cybersecurity Information Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">2. Cybersecurity Information Disclaimer</h2>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">2.1 Threat Intelligence Accuracy</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li><strong>No Guarantee of Accuracy:</strong> Cybersecurity threats evolve rapidly. Information may become outdated or inaccurate within hours of publication.</li>
                <li><strong>False Positives/Negatives:</strong> Threat intelligence may contain false positives or miss emerging threats entirely.</li>
                <li><strong>Attribution Uncertainty:</strong> Threat actor attribution and campaign analysis may be speculative or incorrect.</li>
                <li><strong>IOC Reliability:</strong> Indicators of Compromise (IOCs) may produce false alerts or miss variants of threats.</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">2.2 Vulnerability Information</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li><strong>CVE Data:</strong> Common Vulnerabilities and Exposures (CVE) information is sourced from third parties and may be incomplete or inaccurate.</li>
                <li><strong>CVSS Scores:</strong> Common Vulnerability Scoring System scores are estimates and may not reflect the actual risk to your specific environment.</li>
                <li><strong>Patch Information:</strong> Vendor patch availability and effectiveness may change without notice.</li>
                <li><strong>Exploitation Status:</strong> Information about active exploitation may be delayed or incorrect.</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">2.3 Security Recommendations</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Generic Advice:</strong> Security recommendations are general in nature and may not be appropriate for your specific environment.</li>
                <li><strong>Implementation Risk:</strong> Implementing security measures may disrupt business operations or introduce new vulnerabilities.</li>
                <li><strong>Vendor Dependencies:</strong> Security controls may depend on third-party vendors and their continued support.</li>
                <li><strong>Regulatory Compliance:</strong> Recommendations may not ensure compliance with specific regulatory requirements.</li>
              </ul>
            </section>

            <!-- Professional Advice Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">3. Not Professional Advice</h2>
              <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
                <p class="text-gray-300 leading-relaxed m-0">
                  <strong>Important:</strong> The content on this website does not constitute professional cybersecurity advice, legal advice, or consulting services. For critical security decisions affecting your organization, you should consult with qualified cybersecurity professionals, legal counsel, or certified security consultants.
                </p>
              </div>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">3.1 When to Seek Professional Help</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2">
                <li>Active security incidents or breaches</li>
                <li>Regulatory compliance requirements</li>
                <li>Enterprise-level security architecture decisions</li>
                <li>Legal implications of security measures</li>
                <li>Critical infrastructure protection</li>
                <li>Incident response planning and execution</li>
              </ul>
            </section>

            <!-- Limitation of Liability -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">4. Limitation of Liability</h2>
              <p class="text-gray-300 mb-4">
                IN NO EVENT SHALL CyberNetSec.io, ITS OFFICERS, DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY:
              </p>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">4.1 Security-Related Damages</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Security breaches, data theft, or cyberattacks</li>
                <li>Failed detection of threats or vulnerabilities</li>
                <li>False positive alerts or unnecessary incident responses</li>
                <li>Business disruption from implementing security measures</li>
                <li>Regulatory fines or compliance violations</li>
                <li>Loss of data, systems, or intellectual property</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">4.2 Types of Damages Excluded</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Direct, indirect, incidental, or consequential damages</li>
                <li>Lost profits, revenue, or business opportunities</li>
                <li>Cost of substitute goods or services</li>
                <li>Loss of use, data, or profits</li>
                <li>Business interruption or downtime</li>
                <li>Reputational damage or loss of goodwill</li>
              </ul>

              <p class="text-gray-300">
                This limitation applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if we have been advised of the possibility of such damage.
              </p>
            </section>

            <!-- Third-Party Content Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">5. Third-Party Content and Links</h2>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">5.1 External Sources</h3>
              <p class="text-gray-300 mb-4">
                Our website may contain links to external websites and content from third-party sources, including:
              </p>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Government cybersecurity agencies (CISA, NIST, etc.)</li>
                <li>Security vendors and researchers</li>
                <li>Threat intelligence providers</li>
                <li>Academic institutions and research organizations</li>
                <li>Industry associations and standards bodies</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">5.2 No Endorsement</h3>
              <p class="text-gray-300 mb-4">
                We do not endorse, warrant, or guarantee the accuracy, completeness, or reliability of any third-party content. Links to external sites are provided for convenience only and do not imply our approval of their content, policies, or practices.
              </p>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">5.3 User Responsibility</h3>
              <p class="text-gray-300">
                Users are responsible for evaluating the accuracy, completeness, and usefulness of any third-party information before relying on it. We recommend verifying all information through multiple independent sources.
              </p>
            </section>

            <!-- No Warranty Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">6. No Warranty</h2>
              <p class="text-gray-300 mb-4">
                THE INFORMATION, SOFTWARE, PRODUCTS, AND SERVICES INCLUDED IN OR AVAILABLE THROUGH THE WEBSITE ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              </p>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">6.1 Specific Disclaimers</h3>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li><strong>No Warranty of Accuracy:</strong> We do not warrant that cybersecurity information is accurate, current, or complete.</li>
                <li><strong>No Security Guarantee:</strong> We do not guarantee that our recommendations will protect against all cyber threats.</li>
                <li><strong>No Uptime Warranty:</strong> We do not warrant uninterrupted or error-free operation of our website.</li>
                <li><strong>No Compatibility Warranty:</strong> We do not warrant compatibility with all systems or environments.</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">6.2 Excluded Warranties</h3>
              <p class="text-gray-300">
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
              </p>
            </section>

            <!-- Forward-Looking Statements -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">7. Forward-Looking Statements</h2>
              <p class="text-gray-300 mb-4">
                Our website may contain forward-looking statements about future cybersecurity threats, technology trends, or security developments. These statements are based on current expectations and assumptions and are subject to significant risks and uncertainties.
              </p>
              <ul class="list-disc list-inside text-gray-300 space-y-2">
                <li>Threat predictions may not materialize as expected</li>
                <li>Technology developments may be delayed or fail to emerge</li>
                <li>Regulatory changes may affect cybersecurity landscape</li>
                <li>Actual results may differ materially from projections</li>
              </ul>
            </section>

            <!-- Jurisdictional Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">8. Jurisdictional Disclaimer</h2>
              <p class="text-gray-300 mb-4">
                Our website is controlled and operated from the United States. We make no representation that materials on the website are appropriate or available for use in other locations. Users accessing the website from other jurisdictions are responsible for compliance with local laws.
              </p>
              
              <h3 class="text-xl font-semibold text-purple-400 mb-3">8.1 Export Control Compliance</h3>
              <p class="text-gray-300">
                Some cybersecurity information, tools, or technologies mentioned on our website may be subject to U.S. export control laws and regulations. Users are responsible for ensuring compliance with all applicable export control requirements.
              </p>
            </section>

            <!-- Changes to Disclaimer -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">9. Changes to This Disclaimer</h2>
              <p class="text-gray-300">
                We reserve the right to modify this disclaimer at any time without prior notice. Changes will be effective immediately upon posting on our website. Your continued use of the website following any changes constitutes your acceptance of the modified disclaimer. We encourage you to review this disclaimer periodically.
              </p>
            </section>

            <!-- Responsible Disclosure -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">10. Responsible Disclosure</h2>
              <p class="text-gray-300 mb-4">
                We are committed to responsible disclosure of cybersecurity information. However, users should be aware that:
              </p>
              <ul class="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Vulnerability information may be published before all affected systems are patched</li>
                <li>Some details may be withheld to prevent malicious exploitation</li>
                <li>Disclosure timelines may vary based on threat severity and vendor response</li>
                <li>Information may be embargoed or delayed due to coordinated disclosure practices</li>
              </ul>
              
              <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-blue-400 mb-3">Security Research Ethics</h3>
                <p class="text-gray-300 text-sm leading-relaxed m-0">
                  If you use information from our website for security research, please follow responsible disclosure practices and ethical guidelines. Do not use this information for malicious purposes or unauthorized testing.
                </p>
              </div>
            </section>

            <!-- Contact Information -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">11. Contact Information</h2>
              <p class="text-gray-300 mb-4">
                If you have any questions about this disclaimer or need clarification on any cybersecurity information, please contact us:
              </p>
              
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 class="text-lg font-semibold text-purple-400 mb-3">Security Team</h3>
                <div class="space-y-2 text-gray-300">
                  <p><strong>General Inquiries:</strong> <span class="text-cyan-400">cyber</span><span class="text-gray-500">&#64;</span><span class="text-cyan-400">sharefront.net</span></p>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-700">
                  <p class="text-sm text-gray-400">
                    <strong>For urgent security matters:</strong> Please include "URGENT" in your subject line.
                  </p>
                </div>
              </div>
            </section>

            <!-- Final Acknowledgment -->
            <section>
              <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 class="text-xl font-semibold text-purple-400 mb-3">User Acknowledgment</h3>
                <p class="text-gray-300 text-sm leading-relaxed">
                  By using CyberNetSec.io, you acknowledge that you have read, understood, and agree to be bound by this disclaimer. You understand the limitations and risks associated with cybersecurity information and agree to use such information responsibly and at your own risk.
                </p>
                <p class="text-gray-300 text-sm leading-relaxed mt-3">
                  <strong>Remember:</strong> Cybersecurity is a constantly evolving field. Always verify information through multiple sources and consult with qualified professionals for critical security decisions.
                </p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Disclaimer page setup
</script>

<style scoped>
/* Custom styles for the disclaimer page */
.prose h2 {
  border-bottom: 2px solid rgb(168 85 247 / 0.3);
  padding-bottom: 0.5rem;
}

.prose h3 {
  margin-top: 1.5rem;
}

.prose ul {
  margin-bottom: 1.5rem;
}

.prose a {
  text-decoration: underline;
  text-decoration-color: rgb(34 211 238 / 0.5);
}

.prose a:hover {
  text-decoration-color: rgb(34 211 238);
}
</style>