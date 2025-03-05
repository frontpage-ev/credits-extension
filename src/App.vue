<template>
  <div ref="creditsContent" class="w-full text-white text-center absolute">
    <h1 :style="getStyle('title')">{{ getText('title') }}</h1>

    <section v-if="length(followers) && shouldShow('followers')" class="mt-8">
      <h2 :style="getStyle('heading')">{{ getText('followers') }}</h2>
      <ul class="list-none pl-0">
        <li v-for="(item, index) in followers" :style="getStyle('item')" :key="index">
          {{ index }}
        </li>
      </ul>
    </section>

    <section v-if="length(subscribers) && shouldShow('subscribers')" class="mt-8">
      <h2 :style="getStyle('heading')">{{ getText('subscribers') }}</h2>
      <ul class="list-none pl-0">
        <li v-for="(item, index) in subscribers" :style="getStyle('item')" :key="index">
          {{ index }}
        </li>
      </ul>

    </section>

    <section v-if="length(giftedSubscriptions) && shouldShow('gifted-subscribers')" class="mt-8">
      <h2 :style="getStyle('heading')">{{ getText('gifted-subscribers') }}</h2>
      <ul class="list-none pl-0">
        <li v-for="(item, index) in giftedSubscriptions" :style="getStyle('item')" :key="index">
          {{ index }} - {{ sumAmount(item) }} gifted subs
        </li>
      </ul>
    </section>

    <section v-if="length(cheers) && shouldShow('cheers')" class="mt-8">
      <h2 :style="getStyle('heading')">{{ getText('cheers') }}</h2>
      <ul class="list-none pl-0">
        <li v-for="(item, index) in cheers" :style="getStyle('item')" :key="index">
          {{ index }} - {{ sumBits(item) }} bits
        </li>
      </ul>
    </section>

    <section v-if="length(raids) && shouldShow('raids')" class="mt-8">
      <h2 :style="getStyle('heading')">{{ getText('raids') }}</h2>
      <ul class="list-none pl-0">
        <li v-for="(item, index) in raids" :style="getStyle('item')" :key="index">
          {{ index }} - {{ sumViewers(item) }} viewers
        </li>
      </ul>
    </section>

    <p class="mt-8" :style="getStyle('final')">
      {{ getText('final') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, inject, onMounted, ref } from 'vue'
import axios from 'axios'
import { useContext } from '@own3d/sdk/context'
import type { Context } from '@own3d/sdk/types'
import { useSceneBuilder } from '@own3d/sdk/scene-builder'
import { textStyle } from '@own3d/sdk/support'
import { useInterval } from './composables/useInterval.ts'
import { useFonts } from './composables/useFonts.ts'
import { useNotifications } from './composables/useNotifications.ts'
import { useAuth } from '@own3d/sdk/auth'
import { useNotifications as useNotify } from '@own3d/sdk/notifications'

const {
  fetchNotifications,
  subscribers,
  giftedSubscriptions,
  cheers,
  followers,
  raids,
} = useNotifications()

const creditsContent = ref(null)
const rollCredits = ref(false)

onMounted(() => {
  const container = creditsContent.value
  const windowHeight = window.innerHeight

  container.style.paddingTop = `${windowHeight}px`
  container.style.paddingBottom = `${windowHeight}px`
})

const sumBits = (items) => {
  return items.reduce((acc, item) => acc + item.bits, 0)
}

const sumAmount = (items) => {
  return items.reduce((acc, item) => acc + item.amount, 0)
}

const sumViewers = (items) => {
  return items.reduce((acc, item) => acc + item.viewers, 0)
}

const length = (items) => {
  return Object.keys(items).length
}


useInterval(() => {
  const scrollSpeed = context.value?.values['scroll-speed'] ?? 2
  if (rollCredits.value) window.scrollBy(0, scrollSpeed)
}, 50)

window.onbeforeunload = function () {
  window.scrollTo(0, 0)
}

const context: Ref<Context | null> = ref(null)

const extension = inject('extension')
const {onContext} = useContext(extension)
const {onAuthorized} = useAuth(extension)
const {onClick} = useSceneBuilder(extension)
const {success, patch} = useNotify(extension)

onAuthorized((user) => {
  console.log('Authorized', user.client_token)
  axios.defaults.headers.common['Authorization'] = `Bearer ${user.client_token}`

  const dataRangeInHours = context.value?.values['data-range'] ?? 24
  fetchNotifications(dataRangeInHours).then(() => {
    rollCredits.value = true
  })
})

onContext((_context: Partial<Context>, changed: ReadonlyArray<keyof Context>) => {
  for (const key of changed) {
    context.value = {...context.value, [key]: _context[key]}
  }
}, {immediate: true})

onClick('reset-animation', () => {
  window.scrollTo(0, 0)
})

onClick('reload-event-list', async () => {
  const dataRangeInHours = context.value?.values['data-range'] ?? 24
  const {id} = await success('Fetching event list...')
  fetchNotifications(dataRangeInHours).then(() => {
    rollCredits.value = true
    patch(id, {
      message: 'Event list refreshed!',
    })
  })
})

const getText = computed(() => (type: string) => {
  return context.value?.values[`${type}-text`] ?? ''
})

const getStyle = (type: string) => {
  return lazyLoadFont(textStyle(context.value?.values[`${type}-font-settings`] ?? {}))
}

const shouldShow = computed(() => (type: string) => {
  return context.value?.values[`show-${type}`] ?? false
})

const {loadFont} = useFonts()
const lazyLoadFont = (object: {
  [key: string]: any;
}) => {
  if (object.fontFamily) {
    loadFont(object.fontFamily)
  }
  return object
}

</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>