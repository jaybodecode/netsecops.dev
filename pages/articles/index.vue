<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Cyberpunk Header -->
    <CyberHeader>
      <!-- Desktop buttons - inside header -->
      <div class="hidden md:block">
        <div class="absolute top-16 left-4 z-20">
          <NuxtLink to="/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-cyan-500/50 text-cyan-400 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
            <Icon name="heroicons:home-20-solid" class="w-4 h-4" />
            Home
          </NuxtLink>
        </div>
        
        <div class="absolute top-16 right-4 z-20">
          <NuxtLink to="/publications" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
            <Icon name="heroicons:book-open-20-solid" class="w-4 h-4" />
            Publications
          </NuxtLink>
        </div>
      </div>
    </CyberHeader>

    <!-- Mobile Navigation (Outside Header) -->
    <div class="md:hidden px-4 py-4 bg-gray-950 border-b border-gray-800">
      <div class="flex justify-between items-center max-w-6xl mx-auto gap-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-cyan-500/50 text-cyan-400 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
          <Icon name="heroicons:home-20-solid" class="w-4 h-4" />
          Home
        </NuxtLink>
        <NuxtLink to="/publications" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
          <Icon name="heroicons:book-open-20-solid" class="w-4 h-4" />
          Publications
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          Security Advisories & Threat Intelligence
        </h1>
        <p class="text-xl text-cyan-300/80">
          Real-time cybersecurity alerts, vulnerability advisories, and threat analysis
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="space-y-6">
        <!-- Skeleton Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div v-for="i in 4" :key="i" class="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 animate-pulse">
            <div class="h-8 bg-gray-800 rounded mb-2"/>
            <div class="h-4 bg-gray-800 rounded w-20"/>
          </div>
        </div>
        
        <!-- Skeleton Articles -->
        <div v-for="i in 3" :key="i" class="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 animate-pulse">
          <div class="h-6 bg-gray-800 rounded w-3/4 mb-3"/>
          <div class="h-4 bg-gray-800 rounded w-1/2 mb-4"/>
          <div class="h-4 bg-gray-800 rounded w-full mb-2"/>
          <div class="h-4 bg-gray-800 rounded w-full"/>
        </div>
      </div>
      
      <!-- Stats Bar / Severity Filters -->
      <div v-else-if="articles && articles.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <!-- Total Articles (shows filtered count before severity filter) -->
        <button
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all group',
            selectedSeverities.length === 0
              ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105'
              : 'border-gray-700 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
          ]"
          @click="clearSeverityFilter"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-cyan-400">{{ articlesFilteredByCategoryAndSearch.length }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">
              {{ selectedCategories.length > 0 || searchQuery ? 'Filtered' : 'Total' }}
            </div>
            <div v-if="selectedSeverities.length === 0" class="text-xs text-cyan-400 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
        
        <!-- Critical -->
        <button
          :disabled="criticalCount === 0"
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all',
            criticalCount === 0 
              ? 'cursor-not-allowed border-gray-700'
              : selectedSeverities.includes('critical')
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105 group'
                : 'border-gray-700 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 group'
          ]"
          @click="criticalCount > 0 && toggleSeverity('critical')"
        >
          <div v-if="criticalCount > 0" class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-red-500">{{ criticalCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Critical</div>
            <div v-if="selectedSeverities.includes('critical')" class="text-xs text-red-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
        
        <!-- High -->
        <button
          :disabled="highCount === 0"
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all',
            highCount === 0
              ? 'cursor-not-allowed border-gray-700'
              : selectedSeverities.includes('high')
                ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105 group'
                : 'border-gray-700 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105 group'
          ]"
          @click="highCount > 0 && toggleSeverity('high')"
        >
          <div v-if="highCount > 0" class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-orange-500">{{ highCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">High</div>
            <div v-if="selectedSeverities.includes('high')" class="text-xs text-orange-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
        
        <!-- Medium/Low -->
        <button
          :disabled="mediumCount === 0"
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all',
            mediumCount === 0
              ? 'cursor-not-allowed border-gray-700'
              : selectedSeverities.includes('medium-low')
                ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105 group'
                : 'border-gray-700 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-105 group'
          ]"
          @click="mediumCount > 0 && toggleSeverity('medium-low')"
        >
          <div v-if="mediumCount > 0" class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-yellow-500">{{ mediumCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Medium/Low</div>
            <div v-if="selectedSeverities.includes('medium-low')" class="text-xs text-yellow-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>

        <!-- Informational -->
        <button
          :disabled="informationalCount === 0"
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all',
            informationalCount === 0
              ? 'cursor-not-allowed border-gray-700'
              : selectedSeverities.includes('informational')
                ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105 group'
                : 'border-gray-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 group'
          ]"
          @click="informationalCount > 0 && toggleSeverity('informational')"
        >
          <div v-if="informationalCount > 0" class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-blue-500">{{ informationalCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Informational</div>
            <div v-if="selectedSeverities.includes('informational')" class="text-xs text-blue-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
      </div>

      <!-- Search Bar and Hide Read Toggle -->
      <div v-if="articles && articles.length > 0" class="mb-6 flex flex-col sm:flex-row gap-4">
        <!-- Search Bar -->
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search articles by title, tags, CVEs..."
            class="w-full bg-gray-900 border-2 border-cyan-500/30 rounded-lg px-4 py-3 pl-12 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
          />
          <Icon name="heroicons:magnifying-glass-20-solid" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
        </div>

        <!-- Article Type Multi-Select Dropdown -->
        <div class="relative flex-shrink-0">
          <button
            @click="showArticleTypeDropdown = !showArticleTypeDropdown"
            class="bg-gray-900 border-2 border-orange-500/30 rounded-lg px-4 py-3 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all flex items-center gap-3 w-full sm:w-auto justify-between"
          >
            <div class="flex items-center gap-2">
              <Icon name="heroicons:document-text-20-solid" class="w-5 h-5 text-orange-400" />
              <span class="font-bold text-orange-300 uppercase tracking-wider whitespace-nowrap">
                Article Type
              </span>
              <span v-if="selectedArticleTypes.length < ALL_ARTICLE_TYPES.length" class="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                {{ selectedArticleTypes.length }}
              </span>
            </div>
            <Icon 
              :name="showArticleTypeDropdown ? 'heroicons:chevron-up-20-solid' : 'heroicons:chevron-down-20-solid'" 
              class="w-4 h-4 text-orange-400" 
            />
          </button>
          
          <!-- Dropdown Menu -->
          <div
            v-if="showArticleTypeDropdown"
            class="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:min-w-[280px] bg-gray-900 border-2 border-orange-500/50 rounded-lg shadow-[0_0_25px_rgba(249,115,22,0.3)] z-50 overflow-hidden"
          >
            <!-- Select All / Deselect All -->
            <div class="border-b border-orange-500/30 p-3">
              <button
                @click="selectAllArticleTypes"
                class="w-full px-3 py-2 rounded text-sm font-bold bg-orange-500/20 border border-orange-500/50 text-orange-300 hover:border-orange-500 hover:shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all uppercase tracking-wider"
              >
                <Icon name="heroicons:check-circle-20-solid" class="w-4 h-4 inline mr-2" />
                Select All
              </button>
            </div>
            
            <!-- Article Type Checkboxes -->
            <div class="max-h-[300px] overflow-y-auto">
              <label
                v-for="type in ALL_ARTICLE_TYPES"
                :key="type"
                class="flex items-center gap-3 px-4 py-3 hover:bg-orange-500/10 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
              >
                <div 
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                    selectedArticleTypes.includes(type)
                      ? 'bg-orange-500/30 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' 
                      : 'border-orange-500/50'
                  ]"
                >
                  <Icon 
                    v-if="selectedArticleTypes.includes(type)" 
                    name="heroicons:check-20-solid" 
                    class="w-4 h-4 text-orange-300" 
                  />
                </div>
                <input
                  type="checkbox"
                  :checked="selectedArticleTypes.includes(type)"
                  @change="toggleArticleType(type)"
                  class="sr-only"
                />
                <span class="text-sm font-medium text-gray-300">{{ type }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Hide Read Articles Toggle -->
        <button
          class="bg-gray-900 border-2 border-green-500/30 rounded-lg px-4 py-3 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all flex items-center gap-3 flex-shrink-0 justify-center sm:justify-start"
          @click="hideReadArticles = !hideReadArticles"
        >
          <div class="flex items-center gap-3">
            <div 
              :class="[
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                hideReadArticles 
                  ? 'bg-green-500/30 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                  : 'border-green-500/50'
              ]"
            >
              <Icon 
                v-if="hideReadArticles" 
                name="heroicons:check-20-solid" 
                class="w-4 h-4 text-green-300" 
              />
            </div>
            <span class="font-bold text-green-300 uppercase tracking-wider whitespace-nowrap">Hide Read</span>
          </div>
          <span class="text-sm text-gray-400 whitespace-nowrap">
            {{ readArticlesCount }} read
          </span>
        </button>
      </div>

      <!-- Category Filter -->
      <div v-if="articles && articles.length > 0 && availableCategories.length > 0" class="mb-6">
        <div class="bg-gray-900 border-2 border-purple-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="heroicons:funnel-20-solid" class="w-5 h-5 text-purple-400" />
            <h3 class="font-bold text-purple-300 uppercase tracking-wider">Filter by Category</h3>
            <span v-if="selectedCategories.length > 0 || searchQuery" class="ml-auto text-sm text-cyan-400">
              Showing {{ sortedArticles.length }} of {{ articles.length }}
            </span>
          </div>

          <!-- Active Filters (Chips) -->
          <div v-if="selectedCategories.length > 0" class="mb-3 flex flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-purple-400 uppercase tracking-wider">Active filters:</span>
              <button
                v-for="category in selectedCategories"
                :key="'chip-' + category"
                class="px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 group bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:border-purple-500 hover:shadow-[0_0_10px_rgba(168,85,247,0.4)] uppercase tracking-wider"
                @click="toggleCategory(category)"
              >
                {{ category }}
                <span class="ml-1 text-xs opacity-60">({{ getCategoryCount(category) }})</span>
                <Icon name="heroicons:x-mark-20-solid" class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </button>
              <button
                v-if="selectedCategories.length > 1"
                class="px-3 py-1.5 rounded text-xs font-bold bg-gray-800 border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all flex items-center gap-1 uppercase tracking-wider"
                @click="clearAllCategories"
              >
                <Icon name="heroicons:x-circle-20-solid" class="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          </div>
          
          <!-- Category Selection Buttons -->
          <div v-if="unselectedCategories.length > 0" class="flex flex-wrap gap-2">
            <!-- Show All Button (when filters are active) -->
            <button
              v-if="selectedCategories.length > 0"
              class="px-3 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 bg-gray-800 border border-cyan-500/30 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:scale-105 uppercase tracking-wider"
              @click="clearAllCategories"
            >
              <Icon name="heroicons:squares-2x2-20-solid" class="w-4 h-4" />
              Show All
              <span class="ml-1 text-xs opacity-75">({{ articles.length }})</span>
            </button>

            <!-- Unselected Category Buttons -->
            <button
              v-for="category in unselectedCategories"
              :key="category"
              class="px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-300 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105"
              @click="toggleCategory(category)"
            >
              {{ category }}
              <span class="ml-1 text-xs opacity-75">({{ getCategoryCount(category) }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination Info and Controls (Top) -->
      <div v-if="articles && articles.length > 0 && totalPages > 1" class="mb-6">
        <div class="bg-gray-900 border-2 border-cyan-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <!-- Page Info -->
            <div class="text-gray-300">
              Showing <span class="text-cyan-400 font-bold">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> 
              - <span class="text-cyan-400 font-bold">{{ Math.min(currentPage * itemsPerPage, sortedArticles.length) }}</span> 
              of <span class="text-cyan-400 font-bold">{{ sortedArticles.length }}</span> articles
            </div>

            <!-- Pagination Controls -->
            <div class="flex items-center gap-3">
              <button
                @click="currentPage = 1"
                :disabled="currentPage === 1"
                :class="[
                  'px-3 py-2 rounded font-bold text-sm transition-all',
                  currentPage === 1
                    ? 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
                ]"
              >
                <Icon name="heroicons:chevron-double-left-20-solid" class="w-4 h-4" />
              </button>

              <div class="px-4 py-2 bg-cyan-500/20 border-2 border-cyan-500 rounded text-cyan-300 font-bold">
                {{ currentPage }} / {{ totalPages }}
              </div>

              <button
                @click="currentPage = totalPages"
                :disabled="currentPage === totalPages"
                :class="[
                  'px-3 py-2 rounded font-bold text-sm transition-all',
                  currentPage === totalPages
                    ? 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
                ]"
              >
                <Icon name="heroicons:chevron-double-right-20-solid" class="w-4 h-4" />
              </button>
            </div>

            <!-- Items per page selector -->
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-sm">Per page:</span>
              <select
                v-model.number="itemsPerPage"
                class="bg-gray-900 border-2 border-purple-500/50 text-purple-300 rounded px-3 py-2 font-bold text-sm focus:border-purple-500 focus:outline-none transition-all"
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Articles List -->
      <div v-if="articles && articles.length > 0" class="space-y-6">
        <div
          v-for="article in paginatedArticles"
          :key="article.id"
          class="relative overflow-hidden bg-gray-900 border-2 border-purple-500/30 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all group"
        >
          <NuxtLink :to="`/articles/${article.slug}`" class="block" @click="markArticleAsRead(article.id)">
            <div class="flex items-stretch relative overflow-hidden">
              <!-- Article Content -->
              <div class="w-full p-6 z-10 relative md:flex-1 md:min-w-0">
                <!-- Title Row with Severity Badge -->
                <div class="flex items-start gap-3 mb-2">
                  <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-pink-400 hover:to-cyan-400 transition-all flex-1">
                    {{ article.headline }}
                  </h2>
                  
                  <!-- UPDATED Badge (if article was updated) -->
                  <span
                    v-if="article.createdAt !== article.updatedAt"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-300 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse"
                  >
                    ⚡ UPDATED
                  </span>
                  
                  <!-- Severity Badge -->
                  <span
                    v-if="article.severity === 'critical'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  >
                    CRITICAL
                  </span>
                  <span
                    v-else-if="article.severity === 'high'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-orange-500/20 border-2 border-orange-500 text-orange-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  >
                    HIGH
                  </span>
                  <span
                    v-else-if="['medium', 'low'].includes(article.severity || '')"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  >
                    {{ article.severity?.toUpperCase() }}
                  </span>
                  <span
                    v-else-if="article.severity === 'informational'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-blue-500/20 border-2 border-blue-500 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  >
                    INFORMATIONAL
                  </span>
                </div>
                
                <h3 class="text-lg text-gray-300 mb-3 font-semibold">
                  {{ article.title }}
                </h3>

                <p class="text-gray-400 mb-4 line-clamp-2">
                  {{ article.excerpt }}
                </p>

                <!-- Metadata -->
                <div class="flex flex-wrap items-center gap-4 text-sm">
                  <!-- Date - Show Updated if article was updated, otherwise Created -->
                  <div v-if="article.createdAt !== article.updatedAt" class="flex items-center gap-3">
                    <!-- Created Date -->
                    <div class="flex items-center text-cyan-400/80">
                      <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-1" />
                      {{ formatDate(article.createdAt) }}
                    </div>
                    <!-- Updated Date in Gold -->
                    <div class="flex items-center text-yellow-400 font-semibold">
                      <Icon name="heroicons:arrow-path-20-solid" class="w-4 h-4 mr-1" />
                      <span class="mr-1">Updated:</span>
                      {{ formatDate(article.updatedAt) }}
                    </div>
                  </div>
                  <div v-else class="flex items-center text-cyan-400/80">
                    <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-1" />
                    {{ formatDate(article.createdAt) }}
                  </div>
                  
                  <!-- Reading Time -->
                  <div class="flex items-center text-cyan-400/80">
                    <Icon name="heroicons:clock-20-solid" class="w-4 h-4 mr-1" />
                    {{ article.readingTime }} min read
                  </div>
                  
                  <!-- Category Badges (moved here from right side) -->
                  <div v-if="article.categories && article.categories.length > 0" class="flex flex-wrap items-center gap-2">
                    <div
                      v-for="category in article.categories"
                      :key="category"
                      class="flex-shrink-0 px-2 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-300 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                    >
                      {{ category }}
                    </div>
                  </div>
                  
                  <!-- Author -->
                  <div v-if="article.author" class="flex items-center text-cyan-400/80">
                    <Icon name="heroicons:user-circle-20-solid" class="w-4 h-4 mr-1" />
                    {{ article.author.name }}
                  </div>
                </div>

                <!-- Tags Preview -->
                <div v-if="article.tags && article.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="tag in article.tags.slice(0, 5)"
                    :key="tag"
                    class="px-2 py-1 bg-gray-800 border border-purple-500/30 text-purple-300 rounded text-xs font-medium hover:border-purple-500/60 transition-colors"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="article.tags.length > 5"
                    class="px-2 py-1 text-gray-500 text-xs"
                  >
                    +{{ article.tags.length - 5 }} more
                  </span>
                </div>
              </div>

              <!-- Right Side: Category Image with Badges -->
              <div class="absolute inset-0 md:relative md:w-64 md:flex-shrink-0">
                <!-- Category Image (full height) -->
                <div class="absolute inset-0">
                  <NuxtImg
                    :src="getArticleImageUrl(article.categories)"
                    :alt="article.headline"
                    loading="lazy"
                    class="w-full h-full object-cover opacity-30 md:opacity-60"
                    style="mask: linear-gradient(to right, transparent 0%, black 12%); -webkit-mask: linear-gradient(to right, transparent 0%, black 12%);"
                    @error="handleImageError"
                  />
                  
                  <!-- Clean - no overlay needed -->
                </div>

                <!-- Badges Container (overlay on image) -->
                <div class="relative z-10 p-4 flex flex-col h-full justify-end md:justify-start">
                  <!-- READ Badge (bottom right on mobile, top right on desktop) -->
                  <div
                    v-if="isArticleRead(article.id)"
                    class="px-2 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)] backdrop-blur-sm self-end"
                  >
                    <Icon name="heroicons:check-circle-20-solid" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Pagination Controls (Bottom) -->
      <div v-if="articles && articles.length > 0 && totalPages > 1" class="mt-8">
        <div class="bg-gray-900 border-2 border-cyan-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <!-- Page Info -->
            <div class="text-gray-300">
              Showing <span class="text-cyan-400 font-bold">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> 
              - <span class="text-cyan-400 font-bold">{{ Math.min(currentPage * itemsPerPage, sortedArticles.length) }}</span> 
              of <span class="text-cyan-400 font-bold">{{ sortedArticles.length }}</span> articles
            </div>

            <!-- Pagination Controls -->
            <div class="flex items-center gap-3">
              <button
                @click="currentPage = 1"
                :disabled="currentPage === 1"
                :class="[
                  'px-3 py-2 rounded font-bold text-sm transition-all',
                  currentPage === 1
                    ? 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
                ]"
              >
                <Icon name="heroicons:chevron-double-left-20-solid" class="w-4 h-4" />
              </button>

              <div class="px-4 py-2 bg-cyan-500/20 border-2 border-cyan-500 rounded text-cyan-300 font-bold">
                {{ currentPage }} / {{ totalPages }}
              </div>

              <button
                @click="currentPage = totalPages"
                :disabled="currentPage === totalPages"
                :class="[
                  'px-3 py-2 rounded font-bold text-sm transition-all',
                  currentPage === totalPages
                    ? 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
                ]"
              >
                <Icon name="heroicons:chevron-double-right-20-solid" class="w-4 h-4" />
              </button>
            </div>

            <!-- Scroll to top button -->
            <button
              @click="scrollToTop"
              class="px-4 py-2 bg-gray-900 border-2 border-purple-500/50 text-purple-300 rounded font-bold text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105 transition-all uppercase tracking-wider flex items-center gap-2"
            >
              <Icon name="heroicons:arrow-up-20-solid" class="w-4 h-4" />
              Top
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <Icon name="her oicons:document-text-20-solid" class="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 class="text-2xl font-bold mb-2 text-gray-300">No Articles Found</h2>
        <p class="text-gray-400 mb-6">
          There are no cybersecurity articles available yet.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <CyberFooter 
      :stats="{ 
        critical: criticalCount, 
        high: highCount, 
        total: articles?.length || 0 
      }" 
    />
  </div>
</template>

<script setup lang="ts">
import { getArticleImageUrl } from '~/utils/images';
import type { ArticleMetadata } from '~/composables/useArticles';

definePageMeta({
  layout: 'cyber',
});

// Fetch articles using generated articles-index.json (updated during build)
const { data: articlesData, pending } = useArticlesIndex();

// Safe accessor
const articles = computed(() => articlesData.value?.articles || []);

// Search query
const searchQuery = ref('');

// Severity filter
type SeverityFilter = 'critical' | 'high' | 'medium-low' | 'informational';
const selectedSeverities = ref<SeverityFilter[]>([]);

// Category filter - multi-select
const selectedCategories = ref<string[]>([]);

// Article type filter - multi-select
const ALL_ARTICLE_TYPES = ['NewsArticle', 'TechArticle', 'Report', 'Analysis', 'Advisory', 'Unknown'] as const;
type ArticleType = typeof ALL_ARTICLE_TYPES[number];
const selectedArticleTypes = ref<ArticleType[]>([...ALL_ARTICLE_TYPES]); // Default: all selected
const showArticleTypeDropdown = ref(false); // Dropdown visibility

// Hide read articles toggle
const hideReadArticles = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Read articles tracking - localStorage (client-side only)
const STORAGE_KEY = 'readArticles';
const CATEGORIES_STORAGE_KEY = 'selectedCategories';
const ARTICLE_TYPES_STORAGE_KEY = 'selectedArticleTypes';
const readArticles = ref<Record<string, boolean>>({});

// Load read articles from localStorage
const loadReadArticles = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      readArticles.value = JSON.parse(stored);
    }
  } catch {
    // Silent error handling for localStorage
  }
};

// Load selected categories from localStorage
const loadSelectedCategories = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      selectedCategories.value = JSON.parse(stored);
    }
  } catch {
    // Silent error handling for localStorage
  }
};

// Save selected categories to localStorage
const saveSelectedCategories = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(selectedCategories.value));
  } catch {
    // Silent error handling for localStorage
  }
};

// Load selected article types from localStorage
const loadSelectedArticleTypes = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(ARTICLE_TYPES_STORAGE_KEY);
    if (stored) {
      selectedArticleTypes.value = JSON.parse(stored);
    }
  } catch {
    // Silent error handling for localStorage
  }
};

// Save selected article types to localStorage
const saveSelectedArticleTypes = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ARTICLE_TYPES_STORAGE_KEY, JSON.stringify(selectedArticleTypes.value));
  } catch {
    // Silent error handling for localStorage
  }
};

// Save read articles to localStorage 
const saveReadArticles = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readArticles.value));
  } catch {
    // Silent error handling for localStorage
  }
};

// Mark an article as read
const markArticleAsRead = (articleId: string) => {
  if (!readArticles.value[articleId]) {
    readArticles.value[articleId] = true;
    saveReadArticles();
  }
};

// Check if an article has been read
const isArticleRead = (articleId: string): boolean => {
  return !!readArticles.value[articleId];
};

// Handle image loading errors with better fallback
const handleImageError = (payload: string | Event) => {
  if (payload instanceof Event) {
    const target = payload.target as HTMLImageElement;
    if (target && target.src && !target.src.includes('/other.png')) {
      // First try to fallback to the non-optimized version
      const originalSrc = target.src;
      if (originalSrc.includes('_ipx')) {
        // Extract the original path from IPX URL
        const pathMatch = originalSrc.match(/_ipx\/[^/]+(.+)$/);
        if (pathMatch && pathMatch[1]) {
          target.src = pathMatch[1];
          return;
        }
      }
      // If that fails, use the fallback image
      target.src = '/images/categories/other.png';
    }
  }
};

// Count of read articles
const readArticlesCount = computed(() => {
  if (!articles.value || articles.value.length === 0) return 0;
  return articles.value.filter((article: ArticleMetadata) => isArticleRead(article.id)).length;
});

// Load read articles on mount (client-side only)
onMounted(() => {
  loadReadArticles();
  loadSelectedCategories();
  loadSelectedArticleTypes();
  
  // Close dropdown on outside click
  if (typeof window !== 'undefined') {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative.flex-shrink-0')) {
        showArticleTypeDropdown.value = false;
      }
    });
  }
});

// Toggle severity filter
const toggleSeverity = (severity: SeverityFilter) => {
  const index = selectedSeverities.value.indexOf(severity);
  if (index > -1) {
    // Remove: create new array without the item
    selectedSeverities.value = selectedSeverities.value.filter(s => s !== severity);
  } else {
    // Add: create new array with the item
    selectedSeverities.value = [...selectedSeverities.value, severity];
  }
};

// Clear severity filter
const clearSeverityFilter = () => {
  selectedSeverities.value = [];
};

// Toggle category selection
const toggleCategory = (category: string) => {
  const index = selectedCategories.value.indexOf(category);
  if (index > -1) {
    // Remove: create new array without the item
    selectedCategories.value = selectedCategories.value.filter(c => c !== category);
  } else {
    // Add: create new array with the item
    selectedCategories.value = [...selectedCategories.value, category];
  }
  saveSelectedCategories();
};

// Clear all category filters
const clearAllCategories = () => {
  selectedCategories.value = [];
  saveSelectedCategories();
};

// Toggle article type filter
const toggleArticleType = (type: ArticleType) => {
  const index = selectedArticleTypes.value.indexOf(type);
  if (index > -1) {
    // Remove: create new array without the item
    selectedArticleTypes.value = selectedArticleTypes.value.filter(t => t !== type);
  } else {
    // Add: create new array with the item
    selectedArticleTypes.value = [...selectedArticleTypes.value, type];
  }
  saveSelectedArticleTypes();
};

// Select all article types
const selectAllArticleTypes = () => {
  selectedArticleTypes.value = [...ALL_ARTICLE_TYPES];
  saveSelectedArticleTypes();
};

// Get unique categories from articles
const availableCategories = computed(() => {
  if (!articles.value || articles.value.length === 0) return [];
  
  const categories = new Set<string>();
  articles.value.forEach((article: ArticleMetadata) => {
    if (article.categories && article.categories.length > 0) {
      article.categories.forEach((cat: string) => categories.add(cat));
    }
  });
  
  return Array.from(categories).sort();
});

// Get unselected categories (for display)
const unselectedCategories = computed(() => {
  return availableCategories.value.filter(
    category => !selectedCategories.value.includes(category)
  );
});

// Count articles per category
const getCategoryCount = (category: string): number => {
  return articles.value?.filter((a: ArticleMetadata) => 
    a.categories && a.categories.includes(category)
  ).length || 0;
};

// Filter articles by category and search ONLY (before severity filter)
// This is used for severity counts so they show what's available
const articlesFilteredByCategoryAndSearch = computed(() => {
  if (!articles.value || articles.value.length === 0) return [];
  
  let filtered = articles.value;
  
  // Apply hide read filter
  if (hideReadArticles.value) {
    filtered = filtered.filter((article: ArticleMetadata) => !isArticleRead(article.id));
  }
  
  // Apply article type filter
  if (selectedArticleTypes.value.length > 0 && selectedArticleTypes.value.length < ALL_ARTICLE_TYPES.length) {
    filtered = filtered.filter((article: any) => {
      const articleType = article.article_type || 'Unknown';
      return selectedArticleTypes.value.includes(articleType as ArticleType);
    });
  }
  
  // Apply category filter
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter((article: ArticleMetadata) => 
      article.categories && article.categories.some((cat: string) => 
        selectedCategories.value.includes(cat)
      )
    );
  }
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((article: ArticleMetadata) => {
      if (article.headline?.toLowerCase().includes(query)) return true;
      if (article.title?.toLowerCase().includes(query)) return true;
      if (article.excerpt?.toLowerCase().includes(query)) return true;
      if (article.tags?.some((tag: string) => tag.toLowerCase().includes(query))) return true;
      if (article.categories?.some((cat: string) => cat.toLowerCase().includes(query))) return true;
      return false;
    });
  }
  
  return filtered;
});

// Filter articles (includes severity filter)
const filteredArticles = computed(() => {
  let filtered = articlesFilteredByCategoryAndSearch.value;
  
  // Apply severity filter
  if (selectedSeverities.value.length > 0) {
    filtered = filtered.filter((article: ArticleMetadata) => {
      const severity = article.severity || '';
      
      // Check if article matches any selected severity
      for (const selected of selectedSeverities.value) {
        if (selected === 'critical' && severity === 'critical') return true;
        if (selected === 'high' && severity === 'high') return true;
        if (selected === 'medium-low' && ['medium', 'low'].includes(severity)) return true;
        if (selected === 'informational' && severity === 'informational') return true;
      }
      
      return false;
    });
  }
  
  return filtered;
});

// Sort articles by date only (newest to oldest)
const sortedArticles = computed(() => {
  if (!filteredArticles.value || filteredArticles.value.length === 0) return [];
  
  return [...filteredArticles.value].sort((a: ArticleMetadata, b: ArticleMetadata) => {
    // Sort by updatedAt date (newest first)
    const aDate = new Date(a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt).getTime();
    return bDate - aDate;
  });
});

// Pagination computed properties
const totalPages = computed(() => 
  Math.ceil(sortedArticles.value.length / itemsPerPage.value)
);

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedArticles.value.slice(start, end);
});

// Reset to page 1 when filters change
watch([searchQuery, selectedSeverities, selectedCategories, selectedArticleTypes, hideReadArticles], () => {
  currentPage.value = 1;
});

// Adjust current page when items per page changes (prevent out-of-bounds)
watch(itemsPerPage, () => {
  const maxPage = Math.ceil(sortedArticles.value.length / itemsPerPage.value);
  if (currentPage.value > maxPage) {
    currentPage.value = Math.max(1, maxPage);
  }
});

// Count articles by severity (from articles filtered by category/search, NOT by severity)
// This way severity counts show what's available before severity filter is applied
const criticalCount = computed(() => 
  articlesFilteredByCategoryAndSearch.value?.filter((a: ArticleMetadata) => a.severity === 'critical').length || 0
);

const highCount = computed(() => 
  articlesFilteredByCategoryAndSearch.value?.filter((a: ArticleMetadata) => a.severity === 'high').length || 0
);

const mediumCount = computed(() => 
  articlesFilteredByCategoryAndSearch.value?.filter((a: ArticleMetadata) => ['medium', 'low'].includes(a.severity || '')).length || 0
);

const informationalCount = computed(() => 
  articlesFilteredByCategoryAndSearch.value?.filter((a: ArticleMetadata) => a.severity === 'informational').length || 0
);

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return 'N/A';
  }
};

// Scroll to top function
const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// SEO Meta Tags - handled by composable
usePageSeo({
  title: 'Cyber Security Advisories',
  description: 'Browse the latest cybersecurity advisories, vulnerability reports, and threat intelligence from trusted sources.',
  type: 'CollectionPage',
  keywords: ['cybersecurity advisories', 'vulnerability reports', 'threat intelligence', 'CVE database', 'security alerts'],
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>