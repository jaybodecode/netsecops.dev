<script setup lang="ts">
// Props to accept content object and type
interface Props {
  content: {
    headline?: string
    title?: string
    twitter_post?: string
    meta_description?: string
    summary?: string
  }
  contentType: 'article' | 'publication'
}

const props = defineProps<Props>()

// Helper to get the title/headline based on content type
const getTitle = () => {
  return props.content.headline || props.content.title || ''
}

// Helper to get the description based on content type
const getDescription = () => {
  return props.content.meta_description || props.content.summary || ''
}

// Social sharing functions
const shareOnTwitter = () => {
  // Use twitter_post field which is pre-optimized with emojis, hashtags, and character limits
  const text = encodeURIComponent(props.content.twitter_post || getTitle())
  const url = encodeURIComponent(window.location.href)
  // Don't add hashtags if twitter_post already has them
  const hasHashtags = props.content.twitter_post?.includes('#')
  const tweetUrl = hasHashtags 
    ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    : `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=cybersecurity,infosec`
  window.open(tweetUrl, '_blank', 'width=550,height=420')
}

const shareOnLinkedIn = () => {
  const url = encodeURIComponent(window.location.href)
  // LinkedIn's sharing API will automatically pull OG tags for preview
  // The headline, meta_description, and banner.png will be displayed
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=550,height=420')
}

const shareOnReddit = () => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(getTitle())
  window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank', 'width=550,height=500')
}

const shareOnFacebook = () => {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420')
}

const shareViaEmail = () => {
  const subject = encodeURIComponent(getTitle())
  const body = encodeURIComponent(`${getDescription()}\n\n${window.location.href}`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

const shareOnHackerNews = () => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(getTitle())
  window.open(`https://news.ycombinator.com/submitlink?u=${url}&t=${title}`, '_blank', 'width=550,height=500')
}

const shareOnTelegram = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(getTitle())
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'width=550,height=420')
}
</script>

<template>
  <div class="border-t-2 border-gray-800 pt-8 mt-12 mb-8">
    <div class="relative">
      <!-- Animated glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl animate-pulse" />
      
      <div class="relative bg-gray-900 border-2 border-purple-500/30 rounded-lg p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
        <h3 class="text-xl font-bold mb-2 text-center">
          <span class="inline-block animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            📢 Share This {{ contentType === 'article' ? 'Article' : 'Publication' }}
          </span>
        </h3>
        <p class="text-sm text-gray-400 text-center mb-4">Help others stay informed about cybersecurity threats</p>
        
        <div class="flex flex-wrap justify-center gap-3">
          <!-- Share on X (Twitter) -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareOnTwitter"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share on X (Twitter)"
          >
            <Icon name="simple-icons:x" class="w-5 h-5" />
            <span class="hidden sm:inline">X</span>
          </CyberButton>
          
          <!-- Share on LinkedIn -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareOnLinkedIn"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share on LinkedIn"
          >
            <Icon name="simple-icons:linkedin" class="w-5 h-5" />
            <span class="hidden sm:inline">LinkedIn</span>
          </CyberButton>

          <!-- Share on Reddit -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareOnReddit"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share on Reddit"
          >
            <Icon name="simple-icons:reddit" class="w-5 h-5" />
            <span class="hidden sm:inline">Reddit</span>
          </CyberButton>

          <!-- Share on Hacker News -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareOnHackerNews"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share on Hacker News"
          >
            <Icon name="simple-icons:ycombinator" class="w-5 h-5" />
            <span class="hidden sm:inline">HN</span>
          </CyberButton>

          <!-- Share on Telegram -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareOnTelegram"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share on Telegram"
          >
            <Icon name="simple-icons:telegram" class="w-5 h-5" />
            <span class="hidden sm:inline">Telegram</span>
          </CyberButton>

          <!-- Share via Email -->
          <CyberButton
            variant="primary"
            size="md"
            @click="shareViaEmail"
            class="flex items-center gap-2 hover:scale-105 transition-transform"
            title="Share via Email"
          >
            <Icon name="heroicons:envelope-20-solid" class="w-5 h-5" />
            <span class="hidden sm:inline">Email</span>
          </CyberButton>
        </div>
      </div>
    </div>
  </div>
</template>
