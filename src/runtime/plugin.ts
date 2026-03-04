import { defineNuxtPlugin } from '#app';
import { config } from '#build/umami.config.mjs';
import { umTrackView } from './composables';
import { directive } from './directive';

const { useDirective, autoTrack } = config;

export default defineNuxtPlugin({
  name: 'umami-tracker',
  parallel: true,
  async setup(nuxtApp) {
    if (useDirective)
      nuxtApp.vueApp.directive('umami', directive);
    if (autoTrack) {
      // Track the last path we fired a pageview for so that apps using nested
      // <NuxtPage> components (which cause `page:finish` to fire multiple times
      // per navigation) only record a single pageview per route change.
      let lastTrackedPath: string | undefined;
      let pendingTimer: ReturnType<typeof setTimeout> | undefined;

      nuxtApp.hook('page:finish', () => {
        const currentPath = nuxtApp.$router.currentRoute.value.fullPath;

        if (currentPath === lastTrackedPath)
          return;

        // Debounce: if multiple `page:finish` events fire in rapid succession
        // for the same navigation (e.g. nested layouts), only track once.
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          // Re-check in case another navigation started while we were waiting.
          const path = nuxtApp.$router.currentRoute.value.fullPath;
          if (path === lastTrackedPath)
            return;
          lastTrackedPath = path;
          umTrackView();

          // NOTE: The setTimeout is a workaround for `useHead()` updating the
          // page title asynchronously via the same `page:finish` hook. Without
          // it we'd capture the previous page's title.
          // `page:loading:end` would be cleaner but fired twice until Nuxt
          // bug #26535 is resolved.
        }, 250);
      });
    }
  },
});
