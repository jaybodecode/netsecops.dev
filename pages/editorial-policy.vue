<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <Title>Editorial Policy - CyberNetSec.io</Title>
      <Meta name="description" content="Our commitment to accuracy, integrity, and quality in cybersecurity threat intelligence. Learn about our editorial standards, fact-checking process, and journalistic ethics." />
      <Meta name="robots" content="index, follow" />
    </Head>

    <!-- Layout -->
    <NuxtLayout name="cyber">
      <!-- Header -->
      <CyberHeader 
        title="Editorial Policy"
        subtitle="Our Commitment to Accuracy, Integrity & Quality"
        :showHomeButton="true"
      />

      <div class="container mx-auto px-4 py-12 max-w-4xl">

        <!-- Content -->
        <div class="mt-12 prose prose-invert prose-purple max-w-none space-y-8">
          
          <!-- Introduction -->
          <div class="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-lg border border-cyan-500/30 p-8">
            <p class="text-gray-300 leading-relaxed text-lg mb-4">
              At <strong>CyberNetSec.io</strong>, we are committed to providing accurate, timely, and actionable threat intelligence to the cybersecurity community. Our editorial policy reflects our dedication to journalistic integrity, factual accuracy, and transparent operations.
            </p>
            <p class="text-gray-300 leading-relaxed">
              This policy outlines the standards and processes we follow to ensure the quality and reliability of our content.
            </p>
          </div>

          <!-- Core Principles -->
          <section class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-3">
              Core Editorial Principles
            </h2>
            
            <div class="space-y-6">
              <!-- Accuracy -->
              <div class="border-l-4 border-cyan-500 pl-6 py-2">
                <h3 class="text-xl font-semibold text-cyan-400 mb-3">1. Accuracy First</h3>
                <p class="text-gray-300 mb-3">
                  Accuracy is the foundation of trust. We commit to:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Verify all information from multiple reputable sources before publication</li>
                  <li>Clearly distinguish between confirmed facts and speculation</li>
                  <li>Provide confidence levels for threat attribution when appropriate</li>
                  <li>Promptly correct any errors or inaccuracies we identify</li>
                  <li>Update articles when new information becomes available</li>
                </ul>
              </div>

              <!-- Independence -->
              <div class="border-l-4 border-purple-500 pl-6 py-2">
                <h3 class="text-xl font-semibold text-purple-400 mb-3">2. Editorial Independence</h3>
                <p class="text-gray-300 mb-3">
                  Our editorial decisions are made independently, free from commercial or external influence:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Content decisions are based solely on newsworthiness and value to security professionals</li>
                  <li>We do not accept payment for coverage or editorial placement</li>
                  <li>Analysis and recommendations reflect our independent technical assessment</li>
                  <li>Any sponsored content or partnerships are clearly disclosed</li>
                </ul>
              </div>

              <!-- Transparency -->
              <div class="border-l-4 border-green-500 pl-6 py-2">
                <h3 class="text-xl font-semibold text-green-400 mb-3">3. Transparency</h3>
                <p class="text-gray-300 mb-3">
                  We operate with transparency about our methods, sources, and processes:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Clear attribution to original sources with proper links</li>
                  <li>Disclosure of our analytical methodology</li>
                  <li>Identification of information limitations or uncertainties</li>
                  <li>Open communication about corrections and updates</li>
                  <li>Transparent about our team and expertise</li>
                </ul>
              </div>

              <!-- Objectivity -->
              <div class="border-l-4 border-yellow-500 pl-6 py-2">
                <h3 class="text-xl font-semibold text-yellow-400 mb-3">4. Objectivity & Balance</h3>
                <p class="text-gray-300 mb-3">
                  We strive for objective analysis and balanced reporting:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Present facts without sensationalism or bias</li>
                  <li>Provide context and multiple perspectives when relevant</li>
                  <li>Avoid speculation presented as fact</li>
                  <li>Base severity assessments on technical evidence</li>
                  <li>Acknowledge limitations in our analysis</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Content Standards -->
          <section class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-3">
              Content Standards & Process
            </h2>

            <!-- Source Verification -->
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-purple-400 mb-4 flex items-center">
                <Icon name="heroicons:check-badge-20-solid" class="w-6 h-6 mr-2" />
                Source Verification
              </h3>
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p class="text-gray-300 mb-4">
                  <strong>We prioritize reputable, authoritative sources:</strong>
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p class="text-cyan-400 font-semibold mb-2">Primary Sources:</p>
                    <ul class="text-gray-400 text-sm space-y-1">
                      <li>• Government cybersecurity agencies (CISA, NCSC, etc.)</li>
                      <li>• Security vendor research teams</li>
                      <li>• Vulnerability databases (NVD, MITRE)</li>
                      <li>• Official vendor security advisories</li>
                      <li>• Peer-reviewed research</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-purple-400 font-semibold mb-2">Trusted Media:</p>
                    <ul class="text-gray-400 text-sm space-y-1">
                      <li>• Established cybersecurity news outlets</li>
                      <li>• Industry publications with editorial standards</li>
                      <li>• Recognized security researchers</li>
                      <li>• Vetted threat intelligence platforms</li>
                    </ul>
                  </div>
                </div>
                <p class="text-gray-400 text-sm">
                  We cross-reference information from multiple sources and prioritize primary sources whenever possible. All sources are clearly attributed with links to original material.
                </p>
              </div>
            </div>

            <!-- Fact-Checking -->
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-purple-400 mb-4 flex items-center">
                <Icon name="heroicons:magnifying-glass-20-solid" class="w-6 h-6 mr-2" />
                Fact-Checking Process
              </h3>
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p class="text-gray-300 mb-4">
                  Every piece of content undergoes strict human-defined rules and automation execution to:
                </p>
                <ol class="text-gray-300 space-y-3">
                  <li class="flex items-start">
                    <span class="text-cyan-400 font-bold mr-3 flex-shrink-0">1.</span>
                    <div>
                      <strong>Source Verification:</strong> Confirm content used is non-refuted by authoritative sources
                    </div>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 font-bold mr-3 flex-shrink-0">2.</span>
                    <div>
                      <strong>Technical Review:</strong> Security analysts cross-reference claims across 2 or more reputable sources
                    </div>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 font-bold mr-3 flex-shrink-0">3.</span>
                    <div>
                      <strong>Context Verification:</strong> Ensure proper context and avoid misleading framing
                    </div>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 font-bold mr-3 flex-shrink-0">4.</span>
                    <div>
                      <strong>Quality Assurance:</strong> Final review before publication
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <!-- Analysis Standards -->
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-purple-400 mb-4 flex items-center">
                <Icon name="heroicons:chart-bar-20-solid" class="w-6 h-6 mr-2" />
                Analysis Standards
              </h3>
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p class="text-gray-300 mb-4">
                  Our derivative analysis adds value beyond source material:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>MITRE ATT&CK Mapping:</strong> Every threat analyzed against MITRE ATT&CK framework by security professionals</li>
                  <li><strong>D3FEND Integration:</strong> Defensive countermeasures mapped to D3FEND framework</li>
                  <li><strong>Impact Assessment:</strong> Evaluation of potential organizational impact based on technical analysis</li>
                  <li><strong>Detection Guidance:</strong> Actionable detection strategies developed by SOC analysts</li>
                  <li><strong>Mitigation Recommendations:</strong> Practical mitigation steps aligned with industry best practices</li>
                  <li><strong>Observable Extraction:</strong> Machine-readable IOCs extracted and validated</li>
                </ul>
                <p class="text-gray-400 text-sm mt-4">
                  Our analysis represents original work using methodologies used by experienced security professionals and is clearly distinguished from source material.
                </p>
              </div>
            </div>
          </section>

          <!-- Corrections & Updates -->
          <section class="bg-gray-900/50 rounded-lg border border-yellow-500/30 p-8">
            <h2 class="text-2xl font-bold text-yellow-400 mb-6 border-b border-yellow-500/30 pb-3">
              Corrections & Updates Policy
            </h2>

            <div class="space-y-6">
              <!-- Correction Process -->
              <div>
                <h3 class="text-lg font-semibold text-yellow-400 mb-3">When We Make Corrections</h3>
                <p class="text-gray-300 mb-3">
                  We take accuracy seriously and promptly correct any errors:
                </p>
                <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Factual errors are corrected immediately upon discovery</li>
                  <li>Corrections are clearly noted with date and description of the change</li>
                  <li>Significant corrections are highlighted prominently in the article</li>
                  <li>Original incorrect information may be preserved with strikethrough for transparency</li>
                </ul>
              </div>

              <!-- Updates -->
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 class="text-lg font-semibold text-cyan-400 mb-3">Content Updates</h3>
                <p class="text-gray-300 mb-3">
                  Cybersecurity threats evolve rapidly. We update articles when:
                </p>
                <ul class="text-gray-300 space-y-2">
                  <li class="flex items-start">
                    <Icon name="heroicons:arrow-path-20-solid" class="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>New Information Emerges:</strong> Significant developments related to the original threat</span>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:shield-check-20-solid" class="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Patches Released:</strong> Vendor releases fixes or mitigations</span>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:exclamation-triangle-20-solid" class="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Threat Evolution:</strong> Attack techniques or impact changes</span>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:user-group-20-solid" class="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Attribution Updates:</strong> New intelligence about threat actors</span>
                  </li>
                </ul>
                <p class="text-gray-400 text-sm mt-4">
                  All updates are timestamped and summarized in an "Updates" section at the top of the article.
                </p>
              </div>

              <!-- How to Report Errors -->
              <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-red-400 mb-3 flex items-center">
                  <Icon name="heroicons:flag-20-solid" class="w-5 h-5 mr-2" />
                  Found an Error?
                </h3>
                <p class="text-gray-300 mb-3">
                  We welcome corrections from our community. If you identify an error:
                </p>
                <ol class="text-gray-300 space-y-2 ml-4 mb-4">
                  <li>1. Email us at <span class="text-cyan-400"><span class="text-cyan-400">cyber</span><span class="text-gray-400">&#64;</span><span class="text-cyan-400">sharefront.net</span></span></li>
                  <li>2. Include the article URL and specific error details</li>
                  <li>3. Provide supporting sources or evidence when possible</li>
                </ol>
                <p class="text-gray-400 text-sm">
                  We review all correction requests within 24 hours and respond with our findings.
                </p>
              </div>
            </div>
          </section>

          <!-- Attribution & Sources -->
          <section class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-3">
              Source Attribution
            </h2>

            <div class="space-y-6">
              <p class="text-gray-300 leading-relaxed">
                We believe in giving credit where credit is due and maintaining transparency about our information sources.
              </p>

              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 class="text-lg font-semibold text-purple-400 mb-4">Our Attribution Standards:</h3>
                <ul class="text-gray-300 space-y-3">
                  <li class="flex items-start">
                    <Icon name="heroicons:link-20-solid" class="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Direct Links:</strong> Every article includes links to original source material
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:document-text-20-solid" class="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Clear Citations:</strong> Original researchers, vendors, and publications are explicitly credited
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:light-bulb-20-solid" class="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Derivative Work:</strong> Our original analysis, MITRE mapping, and recommendations are clearly identified as our work
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:academic-cap-20-solid" class="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Research Credit:</strong> Security researchers and their organizations are prominently credited
                    </div>
                  </li>
                </ul>
              </div>

              <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-cyan-400 mb-3">What Constitutes Our Original Work:</h3>
                <ul class="text-gray-300 space-y-2 ml-4 list-disc list-inside">
                  <li>MITRE ATT&CK technique mapping and analysis</li>
                  <li>D3FEND countermeasure recommendations</li>
                  <li>Impact assessments and business risk analysis</li>
                  <li>Detection strategies and SIEM query examples</li>
                  <li>Mitigation guidance and remediation steps</li>
                  <li>Observable extraction and formatting</li>
                  <li>Content synthesis and structured presentation</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Responsible Disclosure -->
          <section class="bg-gray-900/50 rounded-lg border border-red-500/30 p-8">
            <h2 class="text-2xl font-bold text-red-400 mb-6 border-b border-red-500/30 pb-3">
              Responsible Disclosure
            </h2>
            
            <div class="space-y-4">
              <p class="text-gray-300 leading-relaxed">
                We adhere to responsible disclosure principles when handling vulnerability information:
              </p>

              <div class="bg-red-900/20 rounded-lg p-6 border border-red-500/30">
                <ul class="text-gray-300 space-y-3">
                  <li class="flex items-start">
                    <Icon name="heroicons:shield-exclamation-20-solid" class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>No Exploit Code:</strong> We do not publish full exploit code that could enable attacks
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:clock-20-solid" class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Vendor Notification:</strong> We respect responsible disclosure timelines set by security researchers
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:check-circle-20-solid" class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Patch Availability:</strong> We note when patches or mitigations are available
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:information-circle-20-solid" class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Context Over Sensationalism:</strong> Focus on defensive actions rather than hype
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Content Aggregation -->
          <section class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-3">
              Content Aggregation & Deduplication
            </h2>

            <div class="space-y-4">
              <p class="text-gray-300 leading-relaxed mb-4">
                Our platform aggregates cybersecurity news from multiple sources. Here's how we handle content:
              </p>

              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 space-y-4">
                <div>
                  <h3 class="text-lg font-semibold text-purple-400 mb-2">Daily Deduplication</h3>
                  <p class="text-gray-300">
                    We automatically identify and consolidate duplicate reporting on the same incident or vulnerability. When multiple sources report the same story, we:
                  </p>
                  <ul class="text-gray-400 text-sm space-y-1 ml-6 mt-2">
                    <li>• Merge duplicate stories into a single comprehensive article</li>
                    <li>• Cite all relevant sources</li>
                    <li>• Preserve unique insights from each source</li>
                    <li>• Update the consolidated article when new information emerges</li>
                  </ul>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-purple-400 mb-2">Value-Added Analysis</h3>
                  <p class="text-gray-300">
                    We don't simply republish source material. Our derivative work includes:
                  </p>
                  <ul class="text-gray-400 text-sm space-y-1 ml-6 mt-2">
                    <li>• Security framework mapping (MITRE ATT&CK, D3FEND)</li>
                    <li>• Technical analysis and context</li>
                    <li>• Actionable recommendations for defenders</li>
                    <li>• Observable extraction and structuring</li>
                    <li>• Impact assessment and prioritization guidance</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <!-- Editorial Team -->
          <section class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-3">
              Our Editorial Team
            </h2>

            <div class="space-y-4">
              <p class="text-gray-300 leading-relaxed">
                CyberNetSec.io is operated by a small team of cybersecurity professionals with diverse backgrounds:
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 class="text-lg font-semibold text-cyan-400 mb-2">Experience Areas</h3>
                  <ul class="text-gray-400 text-sm space-y-1">
                    <li>• Security Operations Center (SOC) analysts</li>
                    <li>• Threat intelligence researchers</li>
                    <li>• Incident response practitioners</li>
                    <li>• Vulnerability assessment specialists</li>
                    <li>• Security engineering professionals</li>
                  </ul>
                </div>

                <div class="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 class="text-lg font-semibold text-purple-400 mb-2">Editorial Oversight</h3>
                  <ul class="text-gray-400 text-sm space-y-1">
                    <li>• Technical accuracy review</li>
                    <li>• Quality assurance processes</li>
                    <li>• Content standards enforcement</li>
                    <li>• Source verification protocols</li>
                    <li>• Continuous improvement initiatives</li>
                  </ul>
                </div>
              </div>

              <p class="text-gray-400 text-sm mt-4">
                Learn more about our team and mission on our <NuxtLink to="/about-us" class="text-cyan-400 hover:text-cyan-300 underline">About Us</NuxtLink> page.
              </p>
            </div>
          </section>

          <!-- Conflicts of Interest -->
          <section class="bg-gray-900/50 rounded-lg border border-yellow-500/30 p-8">
            <h2 class="text-2xl font-bold text-yellow-400 mb-6 border-b border-yellow-500/30 pb-3">
              Conflicts of Interest
            </h2>

            <div class="space-y-4">
              <p class="text-gray-300 leading-relaxed">
                We maintain editorial independence and transparency regarding potential conflicts of interest:
              </p>

              <div class="bg-yellow-900/20 rounded-lg p-6 border border-yellow-500/30">
                <ul class="text-gray-300 space-y-3">
                  <li class="flex items-start">
                    <Icon name="heroicons:x-circle-20-solid" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>No Pay-for-Play:</strong> We do not accept payment for editorial coverage, article placement, or favorable reviews
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:megaphone-20-solid" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Sponsored Content:</strong> Any sponsored or partnered content is clearly labeled and separated from editorial content
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:shield-check-20-solid" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Vendor Relationships:</strong> Any material relationships with security vendors are disclosed
                    </div>
                  </li>
                  <li class="flex items-start">
                    <Icon name="heroicons:scale-20-solid" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Independent Analysis:</strong> Our security assessments are based solely on technical merit
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Contact Editorial Team -->
          <section class="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-lg border border-cyan-500/30 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-4">Questions About Our Editorial Policy?</h2>
            <p class="text-gray-300 mb-6">
              We welcome feedback and questions about our editorial standards and processes.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <NuxtLink to="/contact-us" class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg text-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                <Icon name="heroicons:envelope-20-solid" class="w-5 h-5 mr-2" />
                Contact Us
              </NuxtLink>
              <div class="inline-flex items-center justify-center px-6 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-200 font-semibold">
                <Icon name="heroicons:envelope-20-solid" class="w-5 h-5 mr-2 text-cyan-400" />
                <span class="text-cyan-400">cyber</span><span class="text-gray-400">&#64;</span><span class="text-cyan-400">sharefront.net</span>
              </div>
            </div>
          </section>

          <!-- Last Updated -->
          <section class="text-center pt-8 border-t border-gray-700">
            <p class="text-gray-500 text-sm">
              <strong>Last Updated:</strong> October 18, 2025
            </p>
            <p class="text-gray-500 text-xs mt-2">
              This editorial policy is reviewed and updated regularly to reflect our evolving standards and best practices.
            </p>
          </section>

        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Editorial policy page setup
</script>

<style scoped>
/* Custom styles for the editorial policy page */
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
