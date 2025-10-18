<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <Title>About Us - CyberNetSec.io</Title>
      <Meta name="description" content="Learn about CyberNetSec.io - A small team of cybersecurity enthusiasts providing actionable threat intelligence and expert analysis based on MITRE ATT&CK frameworks." />
      <Meta name="robots" content="index, follow" />
    </Head>

    <!-- Layout -->
    <NuxtLayout name="cyber">
      <!-- Header -->
      <CyberHeader 
        title="About CyberNetSec.io"
        subtitle="Threat Intelligence That Drives Action"
        :showHomeButton="true"
      />

      <div class="container mx-auto px-4 py-12 max-w-4xl">

        <!-- Content -->
        <div class="mt-12 prose prose-invert prose-purple max-w-none">
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8 space-y-8">
            
            <!-- Mission Statement -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Our Mission</h2>
              <p class="text-gray-300 leading-relaxed">
                CyberNetSec.io is a small team of dedicated cybersecurity enthusiasts committed to doing greater good in the security community. We believe that timely, accurate, deduplicated, and <strong>actionable</strong> threat intelligence should be accessible to security professionals worldwide.
              </p>
              <p class="text-gray-300 leading-relaxed mt-4">
                Our mission is to bridge the gap between raw threat data and practical security operations by providing comprehensive analysis, expert recommendations, and operationally-focused intelligence that security teams can immediately apply to their defense strategies.
              </p>
            </section>

            <!-- What We Do -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">What We Do</h2>
              <p class="text-gray-300 mb-4">
                We go beyond simple news aggregation. Our approach combines human expertise, intelligent automation, and security-tuned analytical processes to deliver value-added intelligence:
              </p>

              <div class="space-y-6">
                <!-- Aggregation & Vetting -->
                <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                    <span class="text-2xl mr-3">🔍</span>
                    Aggregate, Deduplicate & Vet Multiple Sources
                  </h3>
                  <p class="text-gray-300 leading-relaxed mb-4">
                    We continuously monitor and curate cybersecurity information from diverse public sources, industry publications, vulnerability databases, and security research. Each piece of information undergoes rigorous vetting to ensure accuracy and relevance before reaching our platform.
                  </p>
                  <p class="text-gray-300 leading-relaxed">
                    <strong>Daily Deduplication:</strong> On a daily basis, we deduplicate news that is repeated with no additional new information. When real updates emerge related to an original story, we aggregate those updates into the existing article rather than creating duplicate entries, ensuring you get a complete, evolving picture of each threat without information overload.
                  </p>
                </div>

                <!-- Analysis & Enrichment -->
                <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                    <span class="text-2xl mr-3">🧠</span>
                    Analyze & Enrich
                  </h3>
                  <p class="text-gray-300 leading-relaxed mb-4">
                    Our team doesn't just republish information—we <strong>analyze it</strong>. Every threat report, vulnerability disclosure, and security advisory is enhanced with:
                  </p>
                  <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li><strong>Technical Analysis:</strong> Deep-dive examination of attack techniques, vulnerabilities, and exploitation methods</li>
                    <li><strong>Observable Extraction:</strong> Identification and cataloging of indicators of compromise (IOCs) including IP addresses, domains, file hashes, and behavioral patterns</li>
                    <li><strong>Context & Correlation:</strong> Connecting threats to historical campaigns, threat actor attribution, and industry targeting patterns</li>
                    <li><strong>Risk Assessment:</strong> Evaluation of potential business impact and likelihood of exploitation</li>
                  </ul>
                </div>

                <!-- MITRE ATT&CK Mapping -->
                <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                    <span class="text-2xl mr-3">🎯</span>
                    MITRE ATT&CK and D3FEND Framework Mapping
                  </h3>
                  <p class="text-gray-300 leading-relaxed mb-4">
                    Every threat we analyze is mapped to the <a href="https://attack.mitre.org/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline">MITRE ATT&CK®</a> and <a href="https://d3fend.mitre.org/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline">D3FEND</a> frameworks and methodologies, providing:
                  </p>
                  <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li><strong>Tactic & Technique Identification:</strong> Precise mapping to ATT&CK tactics and techniques used in each attack</li>
                    <li><strong>Sub-technique Coverage:</strong> Detailed breakdown of specific implementation methods</li>
                    <li><strong>Procedure Examples:</strong> Real-world usage patterns observed in the wild</li>
                    <li><strong>Detection Guidance:</strong> ATT&CK-aligned detection strategies and data sources</li>
                    <li><strong>Defensive Countermeasures:</strong> D3FEND-based defensive techniques and mitigations</li>
                  </ul>
                </div>

                <!-- Actionable Recommendations -->
                <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                    <span class="text-2xl mr-3">🛡️</span>
                    Industry-Leading Recommendations
                  </h3>
                  <p class="text-gray-300 leading-relaxed mb-4">
                    Based on our analysis and MITRE ATT&CK and D3FEND framework mapping, we provide <strong>comprehensive, actionable recommendations</strong> in three critical areas:
                  </p>
                  
                  <div class="space-y-4 ml-4">
                    <div class="border-l-4 border-cyan-500 pl-4">
                      <h4 class="text-lg font-semibold text-cyan-400 mb-2">Impact Assessment</h4>
                      <p class="text-gray-300 text-sm">
                        Detailed evaluation of potential organizational impact including affected systems, business functions at risk, data exposure scenarios, and financial/reputational consequences.
                      </p>
                    </div>

                    <div class="border-l-4 border-purple-500 pl-4">
                      <h4 class="text-lg font-semibold text-purple-400 mb-2">Detection & Response</h4>
                      <p class="text-gray-300 text-sm">
                        Practical detection methodologies including specific log sources to monitor, SIEM query examples, EDR/XDR detection rules, network traffic patterns, and incident response playbooks tailored to each threat.
                      </p>
                    </div>

                    <div class="border-l-4 border-green-500 pl-4">
                      <h4 class="text-lg font-semibold text-green-400 mb-2">Mitigation Strategies</h4>
                      <p class="text-gray-300 text-sm">
                        Step-by-step mitigation guidance aligned with MITRE's defense recommendations, including configuration hardening, patch prioritization, network segmentation strategies, and compensating controls when patches aren't available.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Observable Intelligence -->
                <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                    <span class="text-2xl mr-3">📊</span>
                    Operationalizable Intelligence
                  </h3>
                  <p class="text-gray-300 leading-relaxed">
                    Beyond narrative analysis, we extract and structure <strong>machine-readable observables</strong> from each threat, including IP addresses, domain names, URLs, file hashes, registry keys, and behavioral indicators. These observables are prepared for immediate integration into your security tools, SIEM platforms, and threat intelligence feeds.
                  </p>
                </div>
              </div>
            </section>

            <!-- Our Approach -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Our Approach</h2>
              <p class="text-gray-300 mb-4">
                We employ a hybrid methodology that combines the best of human expertise and intelligent automation:
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-purple-900/20 to-gray-800/50 rounded-lg p-5 border border-purple-500/30">
                  <h3 class="text-lg font-semibold text-purple-400 mb-3">👥 Human Expertise</h3>
                  <ul class="text-sm text-gray-300 space-y-2">
                    <li>• Security analysts with SOC experience</li>
                    <li>• Threat intelligence researchers</li>
                    <li>• Incident response practitioners</li>
                    <li>• Quality assurance and validation</li>
                  </ul>
                </div>

                <div class="bg-gradient-to-br from-cyan-900/20 to-gray-800/50 rounded-lg p-5 border border-cyan-500/30">
                  <h3 class="text-lg font-semibold text-cyan-400 mb-3">🤖 Intelligent Automation</h3>
                  <ul class="text-sm text-gray-300 space-y-2">
                    <li>• Security-tuned content processing</li>
                    <li>• Automated observable extraction</li>
                    <li>• Pattern recognition and correlation</li>
                    <li>• Continuous monitoring and updates</li>
                  </ul>
                </div>
              </div>

              <p class="text-gray-300 mt-6 leading-relaxed">
                This combined approach ensures speed without sacrificing accuracy, and scale without losing the nuanced understanding that only experienced security professionals can provide.
              </p>
            </section>

            <!-- Value Proposition -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Why CyberNetSec.io?</h2>
              <p class="text-gray-300 mb-4">
                In a world flooded with security alerts and vulnerability announcements, security teams need more than just raw data—they need <strong>actionable intelligence</strong>. Here's what sets us apart:
              </p>

              <div class="space-y-3">
                <div class="flex items-start space-x-3">
                  <span class="text-green-400 text-xl">✓</span>
                  <p class="text-gray-300"><strong>Derivative Analysis:</strong> We don't just aggregate—we analyze, enrich, and provide context that transforms information into intelligence</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="text-green-400 text-xl">✓</span>
                  <p class="text-gray-300"><strong>MITRE-Aligned:</strong> Every threat mapped to industry-standard ATT&CK and D3FEND frameworks for consistent understanding and defensive planning</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="text-green-400 text-xl">✓</span>
                  <p class="text-gray-300"><strong>Actionable Recommendations:</strong> Specific, practical guidance for detection, response, and mitigation</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="text-green-400 text-xl">✓</span>
                  <p class="text-gray-300"><strong>Operationally Focused:</strong> Intelligence designed for immediate use by SOC analysts, incident responders, and security engineers</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="text-green-400 text-xl">✓</span>
                  <p class="text-gray-300"><strong>Community-Driven:</strong> Built by security professionals, for security professionals</p>
                </div>
              </div>
            </section>

            <!-- Future Vision -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Platform Features</h2>
              <p class="text-gray-300 leading-relaxed mb-4">
                Our platform is designed with security professionals in mind, offering powerful features to help you focus on what matters most:
              </p>
              <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
                <li><strong>Category Filtering:</strong> Filter threat intelligence by categories of interest (Malware, Ransomware, Vulnerabilities, Data Breaches, etc.) to focus on relevant threats</li>
                <li><strong>Persistent Filters:</strong> Your filter preferences are retained across multiple page views for a seamless browsing experience</li>
                <li><strong>Read Item Tracking:</strong> Automatically track which articles you've already reviewed to avoid re-reading the same content</li>
                <li><strong>Filter Read Items:</strong> Option to hide articles you've already read, keeping your view focused on new intelligence</li>
                <li><strong>Daily Updates:</strong> Fresh threat intelligence delivered daily with real-time deduplication</li>
              </ul>

              <h3 class="text-xl font-semibold text-purple-400 mb-3">Looking Ahead</h3>
              <p class="text-gray-300 leading-relaxed mb-4">
                We're continuously evolving our platform to better serve the security community. Our roadmap includes:
              </p>
              <ul class="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Enhanced threat correlation and campaign tracking capabilities</li>
                <li>API access for automated intelligence integration</li>
                <li>Custom alerting based on your threat profile and industry</li>
                <li>Expanded coverage of emerging threat vectors and technologies</li>
                <li>Community collaboration features for collective defense</li>
              </ul>
            </section>

            <!-- Transparency & Ethics -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Transparency & Ethics</h2>
              <p class="text-gray-300 leading-relaxed mb-4">
                We believe in operating with transparency and ethical responsibility:
              </p>
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <ul class="text-gray-300 space-y-3">
                  <li class="flex items-start">
                    <span class="text-cyan-400 mr-3 font-bold">•</span>
                    <span><strong>Source Attribution:</strong> We properly attribute original sources and maintain links to original research and publications</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 mr-3 font-bold">•</span>
                    <span><strong>Added Value:</strong> Our analysis, MITRE mapping, and recommendations represent significant original work beyond source material</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 mr-3 font-bold">•</span>
                    <span><strong>Responsible Disclosure:</strong> We follow industry best practices for vulnerability disclosure and never publish information that could enable attacks</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 mr-3 font-bold">•</span>
                    <span><strong>Privacy First:</strong> We respect user privacy and handle all data in accordance with our <NuxtLink to="/privacy-policy" class="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</NuxtLink></span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-cyan-400 mr-3 font-bold">•</span>
                    <span><strong>Community Support:</strong> We contribute back to the security community through open collaboration and knowledge sharing</span>
                  </li>
                </ul>
              </div>
            </section>

            <!-- Legal Notice -->
            <section>
              <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                <h3 class="text-xl font-semibold text-yellow-400 mb-3">⚖️ Legal Notice</h3>
                <p class="text-gray-300 text-sm leading-relaxed mb-4">
                  CyberNetSec.io provides derivative analytical work based on publicly available information, original research, and expert analysis. All threat intelligence, recommendations, and assessments represent our independent analytical conclusions.
                </p>
                <p class="text-gray-300 text-sm leading-relaxed">
                  Use of our platform is subject to our <NuxtLink to="/terms-of-service" class="text-cyan-400 hover:text-cyan-300 underline">Terms of Service</NuxtLink> and <NuxtLink to="/privacy-policy" class="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</NuxtLink>. The information provided is for educational and defensive security purposes only. Users are responsible for verifying information and assessing suitability for their specific environments.
                </p>
              </div>
            </section>

            <!-- Contact -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Get in Touch</h2>
              
              <p class="text-gray-300 mb-6">
                For all general inquiries, feedback, security issues, and partnership opportunities, please reach out at <span class="text-cyan-400 font-semibold"><span class="text-cyan-400">cyber</span><span class="text-gray-400">&#64;</span><span class="text-cyan-400">sharefront.net</span></span>. We typically respond within 24-48 hours during business days.
              </p>
              
              <!-- Founder Profile -->
              <div class="bg-gray-900/50 rounded-lg border border-cyan-500/20 p-6">
                <div class="flex items-start gap-6 mb-6">
                  <!-- Founder Photo -->
                  <div class="flex-shrink-0">
                    <img 
                      src="/images/bio-images/JasonGomes.jpeg" 
                      alt="Jason Gomes - Founder"
                      class="w-24 h-24 rounded-full border-2 border-cyan-500/30"
                    />
                  </div>
                  
                  <!-- Founder Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-semibold text-cyan-400 mb-1">Jason Gomes</h3>
                    <p class="text-purple-400 text-sm mb-3">CybeNetSec.io Founder &  Cybersecurity Practitioner</p>
                    
                    <div class="flex items-center gap-3 mb-4">
                      <div class="text-cyan-400 flex items-center gap-1 text-sm">
                        <Icon name="heroicons:envelope-20-solid" class="w-4 h-4" />
                        <span class="text-cyan-400">cyber</span><span class="text-gray-400">&#64;</span><span class="text-cyan-400">sharefront.net</span>
                      </div>
                      <a 
                        href="https://www.linkedin.com/in/jasongomes/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-sm"
                        title="Connect on LinkedIn"
                      >
                        <Icon name="mdi:linkedin" class="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    </div>
                    
                    <div class="text-gray-300 text-sm leading-relaxed space-y-3">
                      <p>
                        I created CyberNetSec.io out of personal frustration trying to keep up with the overwhelming velocity of cybersecurity news. As a security professional, I found myself drowning in duplicate stories, scattered sources, and endless notifications—all while trying to identify threats that actually mattered to me personally.
                      </p>
                      <p>
                        What started as a simple filtering tool evolved into something much more comprehensive. I wanted a way to tag articles for follow-up updates, track developing threats over time, and have all my intelligence in one place without the noise. As the platform grew more useful, I began sharing it with colleagues who faced the same challenges. Their feedback and enthusiasm drove me to make it public.
                      </p>
                      <p>
                        Today, CyberNetSec.io combines intelligent deduplication, real-time update tracking, MITRE ATT&CK mapping, and actionable analysis—all the features I wish existed when I was manually sifting through dozens of security feeds every morning to find stories of interest.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Call for Contributors -->
                <div class="border-t border-gray-700 pt-6 mt-6">
                  <h4 class="text-lg font-semibold text-purple-400 mb-3">📝 Contribute to CyberNetSec.io</h4>
                  <p class="text-gray-300 text-sm leading-relaxed mb-4">
                    We're always looking for talented security analysts who share our commitment to quality threat intelligence. If you have strong attention to detail, can write clear and concise analysis, and are interested in contributing original content based on real-world scenarios, we'd love to hear from you.
                  </p>
                  <p class="text-gray-300 text-sm leading-relaxed">
                    Whether you're interested in writing threat analysis, developing detection rules, or sharing operational insights from the field, reach out to discuss collaboration opportunities. Let's build a better threat intelligence platform together.
                  </p>
                </div>
              </div>
            </section>

            <!-- Acknowledgments -->
            <section>
              <h2 class="text-2xl font-bold text-cyan-400 mb-4">Acknowledgments</h2>
              <p class="text-gray-300 leading-relaxed mb-6">
                We're grateful to the global cybersecurity community, open-source contributors, security researchers, and the following organizations whose frameworks, research, and reporting help advance the field of threat intelligence and defensive security:
              </p>

              <!-- Key Organizations -->
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-purple-400 mb-3">🔑 Key Frameworks & Organizations</h3>
                <div class="flex flex-wrap gap-3">
                  <a href="https://attack.mitre.org/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">MITRE ATT&CK</a>
                  <a href="https://malpedia.caad.fkie.fraunhofer.de/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">Malpedia</a>
                  <a href="https://www.cisa.gov/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">CISA</a>
                  <a href="https://sans.org/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">SANS Institute</a>
                  <a href="https://nvd.nist.gov/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">NIST NVD</a>
                  <a href="https://ncsc.gov.uk/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">NCSC</a>
                  <a href="https://cyber.gov.au/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">Australian Cyber Security Centre</a>
                  <a href="https://cyber.gc.ca/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800/50 border border-cyan-500/30 rounded-md text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all">Canadian Centre for Cyber Security</a>
                </div>
              </div>

              <!-- Data Sources & Partners -->
              <div>
                <h3 class="text-lg font-semibold text-purple-400 mb-3">📰 Trusted Data Sources & Industry Partners</h3>
                <p class="text-gray-400 text-sm mb-3">We aggregate and analyze threat intelligence from the following reputable cybersecurity sources:</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <a href="https://bleepingcomputer.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">BleepingComputer</a>
                  <a href="https://thehackernews.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">The Hacker News</a>
                  <a href="https://krebsonsecurity.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Krebs on Security</a>
                  <a href="https://darkreading.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Dark Reading</a>
                  <a href="https://therecord.media/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">The Record</a>
                  <a href="https://securityweek.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">SecurityWeek</a>
                  <a href="https://theregister.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">The Register</a>
                  <a href="https://scmagazine.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">SC Magazine</a>
                  <a href="https://cyberscoop.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">CyberScoop</a>
                  <a href="https://infosecurity-magazine.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Infosecurity Magazine</a>
                  <a href="https://cybersecuritynews.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Cyber Security News</a>
                  <a href="https://securityaffairs.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Security Affairs</a>
                  <a href="https://securityboulevard.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Security Boulevard</a>
                  <a href="https://helpnetsecurity.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Help Net Security</a>
                  <a href="https://thecyberexpress.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">The Cyber Express</a>
                  <a href="https://gbhackers.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">GBHackers on Security</a>
                  <a href="https://cybersecuritydive.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Cybersecurity Dive</a>
                  <a href="https://esecurityplanet.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">eSecurity Planet</a>
                  <a href="https://industrialcyber.co/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Industrial Cyber</a>
                  <a href="https://theguardian.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">The Guardian</a>
                  <a href="https://bankinfosecurity.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">BankInfoSecurity</a>
                  <a href="https://hipaajournal.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">HIPAA Journal</a>
                  <a href="https://ransomware.live/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Ransomware.live</a>
                  <a href="https://blog.talosintelligence.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Cisco Talos</a>
                  <a href="https://research.checkpoint.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Check Point Research</a>
                  <a href="https://exchange.xforce.ibmcloud.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">IBM X-Force</a>
                  <a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Google Threat Intelligence</a>
                  <a href="https://securelist.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Securelist</a>
                  <a href="https://malwarebytes.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Malwarebytes</a>
                  <a href="https://bitdefender.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Bitdefender</a>
                  <a href="https://greynoise.io/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">GreyNoise</a>
                  <a href="https://socradar.io/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">SOCRadar</a>
                  <a href="https://socprime.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">SOC Prime</a>
                  <a href="https://qualys.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Qualys</a>
                  <a href="https://snyk.io/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Snyk</a>
                  <a href="https://vulert.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Vulert</a>
                  <a href="https://imperva.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Imperva</a>
                  <a href="https://zscaler.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Zscaler</a>
                  <a href="https://wiz.io/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Wiz</a>
                  <a href="https://arcticwolf.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Arctic Wolf</a>
                  <a href="https://cyfirma.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">CYFIRMA</a>
                  <a href="https://cyware.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Cyware</a>
                  <a href="https://risky.biz/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Risky Business</a>
                  <a href="https://securitymagazine.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Security Magazine</a>
                  <a href="https://medium.com/" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-gray-800/30 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Medium</a>
                </div>
                <p class="text-gray-500 text-xs mt-3 italic">And many more cybersecurity vendors, researchers, and industry publications.</p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// About us page setup
</script>

<style scoped>
/* Custom styles for the about us page */
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

/* Gradient boxes */
.bg-gradient-to-br {
  transition: transform 0.2s ease-in-out;
}

.bg-gradient-to-br:hover {
  transform: translateY(-2px);
}
</style>
