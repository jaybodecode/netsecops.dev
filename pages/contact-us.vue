<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <Title>Contact Us - CyberNetSec.io</Title>
      <Meta name="description" content="Get in touch with the CyberNetSec.io team. Contact us for general inquiries, security issues, partnership opportunities, or editorial questions." />
      <Meta name="robots" content="index, follow" />
    </Head>

    <!-- Layout -->
    <NuxtLayout name="cyber">
      <!-- Header -->
      <CyberHeader 
        title="Contact Us"
        subtitle="We're Here to Help"
        :showHomeButton="true"
      />

      <div class="container mx-auto px-4 py-12 max-w-4xl">

        <!-- Content -->
        <div class="mt-12 space-y-8">
          
          <!-- Introduction -->
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-8">
            <p class="text-gray-300 leading-relaxed text-lg">
              Have questions, feedback, or want to collaborate? We'd love to hear from you. Whether you're a security professional, researcher, or organization looking to enhance your threat intelligence capabilities, we're here to help.
            </p>
          </div>

          <!-- Primary Contact -->
          <section class="bg-gray-900/50 rounded-lg border border-cyan-500/20 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
              <Icon name="heroicons:envelope-20-solid" class="w-7 h-7 mr-3" />
              Primary Contact
            </h2>
            
            <p class="text-gray-300 mb-6">
              For all general inquiries, security issues, and partnership opportunities:
            </p>
            
            <!-- Contact Methods Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <!-- Email -->
              <div class="text-center py-6 bg-gray-800/50 rounded-lg border border-gray-700">
                <Icon name="heroicons:envelope-20-solid" class="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p class="text-xs text-gray-400 mb-2 uppercase tracking-wide">Email</p>
                <div class="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/50 rounded-lg font-semibold text-lg">
                  <span class="text-cyan-300">cyber</span><span class="text-gray-400">&#64;</span><span class="text-cyan-300">sharefront.net</span>
                </div>
              </div>
              
              <!-- Phone -->
              <div class="text-center py-6 bg-gray-800/50 rounded-lg border border-gray-700">
                <Icon name="heroicons:phone-20-solid" class="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p class="text-xs text-gray-400 mb-2 uppercase tracking-wide">Phone</p>
                <div class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg font-semibold text-lg">
                  <Icon name="heroicons:phone-20-solid" class="w-5 h-5 text-purple-300" />
                  <span class="text-purple-300 flex items-center">
                    <span>&#43;</span>
                    <span>&#49;</span>
                    <span class="mx-1">&#40;</span>
                    <span>&#50;</span>
                    <span>&#49;</span>
                    <span>&#52;</span>
                    <span class="mx-1">&#41;</span>
                    <span>&#57;</span>
                    <span>&#52;</span>
                    <span>&#53;</span>
                    <span class="mx-1">&#45;</span>
                    <span>&#52;</span>
                    <span>&#55;</span>
                    <span>&#50;</span>
                    <span>&#55;</span>
                  </span>
                </div>
              </div>
            </div>
            
            <p class="text-sm text-gray-400 text-center">
              We typically respond within 24-48 hours during business days CST timezone
            </p>
          </section>

          <!-- Contact Categories -->
          <section class="space-y-6">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6">What Can We Help You With?</h2>

            <!-- General Inquiries -->
            <div class="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
              <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                <Icon name="heroicons:information-circle-20-solid" class="w-6 h-6 mr-2" />
                General Inquiries
              </h3>
              <p class="text-gray-300 mb-3">
                Questions about our platform, threat intelligence coverage, or how to use our services effectively.
              </p>
              <ul class="text-gray-400 text-sm space-y-1 ml-6">
                <li>• Platform features and capabilities</li>
                <li>• Coverage and update frequency</li>
                <li>• Account or access questions</li>
                <li>• General feedback or suggestions</li>
              </ul>
            </div>

            <!-- Security Issues -->
            <div class="bg-gray-900/50 rounded-lg border border-red-500/30 p-6">
              <h3 class="text-xl font-semibold text-red-400 mb-3 flex items-center">
                <Icon name="heroicons:shield-exclamation-20-solid" class="w-6 h-6 mr-2" />
                Security Issues & Responsible Disclosure
              </h3>
              <p class="text-gray-300 mb-3">
                Found a security vulnerability or concern with our platform? We take security seriously and appreciate responsible disclosure.
              </p>
              <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-3">
                <p class="text-gray-300 text-sm mb-2">
                  <strong class="text-red-400">Please include:</strong>
                </p>
                <ul class="text-gray-400 text-sm space-y-1 ml-4">
                  <li>• Detailed description of the vulnerability</li>
                  <li>• Steps to reproduce the issue</li>
                  <li>• Potential impact assessment</li>
                  <li>• Your contact information</li>
                </ul>
              </div>
              <p class="text-gray-400 text-sm">
                We commit to acknowledging security reports within 48 hours and providing status updates throughout our investigation.
              </p>
            </div>

            <!-- Partnerships & Collaboration -->
            <div class="bg-gray-900/50 rounded-lg border border-green-500/30 p-6">
              <h3 class="text-xl font-semibold text-green-400 mb-3 flex items-center">
                <Icon name="heroicons:users-20-solid" class="w-6 h-6 mr-2" />
                Partnerships & Collaboration
              </h3>
              <p class="text-gray-300 mb-3">
                Interested in partnering, collaborating on research, or integrating with our threat intelligence?
              </p>
              <ul class="text-gray-400 text-sm space-y-1 ml-6">
                <li>• Strategic partnerships</li>
                <li>• Research collaboration opportunities</li>
                <li>• API access and integration</li>
                <li>• Content syndication</li>
                <li>• Data sharing arrangements</li>
              </ul>
            </div>

            <!-- Editorial & Content -->
            <div class="bg-gray-900/50 rounded-lg border border-yellow-500/30 p-6">
              <h3 class="text-xl font-semibold text-yellow-400 mb-3 flex items-center">
                <Icon name="heroicons:pencil-square-20-solid" class="w-6 h-6 mr-2" />
                Editorial & Content Questions
              </h3>
              <p class="text-gray-300 mb-3">
                Questions about our content, corrections, or editorial processes.
              </p>
              <ul class="text-gray-400 text-sm space-y-1 ml-6">
                <li>• Content corrections or clarifications</li>
                <li>• Source attribution questions</li>
                <li>• Guest content submissions</li>
                <li>• Editorial policy questions</li>
              </ul>
              <p class="text-gray-400 text-sm mt-3">
                See our <NuxtLink to="/editorial-policy" class="text-cyan-400 hover:text-cyan-300 underline">Editorial Policy</NuxtLink> for more information about our content standards.
              </p>
            </div>

            <!-- Press & Media -->
            <div class="bg-gray-900/50 rounded-lg border border-purple-500/30 p-6">
              <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center">
                <Icon name="heroicons:newspaper-20-solid" class="w-6 h-6 mr-2" />
                Press & Media Inquiries
              </h3>
              <p class="text-gray-300 mb-3">
                Media professionals seeking information about CyberNetSec.io, our team, or expert commentary on cybersecurity topics.
              </p>
              <ul class="text-gray-400 text-sm space-y-1 ml-6">
                <li>• Press releases and announcements</li>
                <li>• Expert commentary requests</li>
                <li>• Interview opportunities</li>
                <li>• Media kit and assets</li>
              </ul>
            </div>
          </section>

          <!-- Response Times -->
          <section class="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
            <h2 class="text-2xl font-bold text-cyan-400 mb-4">Response Times</h2>
            <div class="space-y-3">
              <div class="flex items-start">
                <Icon name="heroicons:clock-20-solid" class="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-gray-300">
                    <strong>General Inquiries:</strong> <span class="text-gray-400">24-48 hours (business days)</span>
                  </p>
                </div>
              </div>
              <div class="flex items-start">
                <Icon name="heroicons:shield-check-20-solid" class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-gray-300">
                    <strong>Security Issues:</strong> <span class="text-gray-400">Within 48 hours (acknowledged)</span>
                  </p>
                </div>
              </div>
              <div class="flex items-start">
                <Icon name="heroicons:briefcase-20-solid" class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-gray-300">
                    <strong>Partnership Inquiries:</strong> <span class="text-gray-400">3-5 business days</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Location & Business Hours -->
          <section class="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
            <h2 class="text-2xl font-bold text-cyan-400 mb-4">Business Hours</h2>
            <p class="text-gray-300 mb-3">
              Our team operates during standard business hours:
            </p>
            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p class="text-cyan-400 font-semibold mb-2">Monday - Friday</p>
              <p class="text-gray-400">9:00 AM - 6:00 PM CST (Central Standard Time)</p>
              <p class="text-gray-500 text-sm mt-3">
                While we monitor email outside of business hours, please allow additional time for responses on weekends and holidays.
              </p>
            </div>
          </section>

          <!-- Additional Resources -->
          <section class="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-500/30 p-8">
            <h2 class="text-2xl font-bold text-cyan-400 mb-6">Before You Contact Us</h2>
            <p class="text-gray-300 mb-4">
              You might find the answer to your question in these resources:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink to="/about-us" class="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all group">
                <Icon name="heroicons:information-circle-20-solid" class="w-6 h-6 text-cyan-400 mr-3" />
                <div>
                  <p class="text-gray-200 font-semibold group-hover:text-cyan-400 transition-colors">About Us</p>
                  <p class="text-gray-400 text-sm">Learn about our mission and approach</p>
                </div>
              </NuxtLink>
              
              <NuxtLink to="/editorial-policy" class="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all group">
                <Icon name="heroicons:document-text-20-solid" class="w-6 h-6 text-purple-400 mr-3" />
                <div>
                  <p class="text-gray-200 font-semibold group-hover:text-cyan-400 transition-colors">Editorial Policy</p>
                  <p class="text-gray-400 text-sm">Our content standards and processes</p>
                </div>
              </NuxtLink>
              
              <NuxtLink to="/privacy-policy" class="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all group">
                <Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 text-green-400 mr-3" />
                <div>
                  <p class="text-gray-200 font-semibold group-hover:text-cyan-400 transition-colors">Privacy Policy</p>
                  <p class="text-gray-400 text-sm">How we handle your data</p>
                </div>
              </NuxtLink>
              
              <NuxtLink to="/terms-of-service" class="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all group">
                <Icon name="heroicons:document-check-20-solid" class="w-6 h-6 text-yellow-400 mr-3" />
                <div>
                  <p class="text-gray-200 font-semibold group-hover:text-cyan-400 transition-colors">Terms of Service</p>
                  <p class="text-gray-400 text-sm">Usage terms and conditions</p>
                </div>
              </NuxtLink>
            </div>
          </section>

        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Contact us page setup
</script>

<style scoped>
/* Custom styles for the contact us page */
</style>
