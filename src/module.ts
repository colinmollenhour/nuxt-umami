import type { ModuleOptions } from './options';
import type { ModuleMode, NormalizedModuleOptions, UmPrivateConfig, UmPublicConfig } from './types';
import {
  addImports,
  addPlugin,
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit';
import { name, version } from '../package.json';
import { isValidString, normalizeConfig } from './runtime/utils';
import { generateTemplate } from './template';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'umami',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-umami');
    const { resolve } = createResolver(import.meta.url);

    const pathTo = {
      utils: resolve('./runtime/utils'),
      logger: resolve('./runtime/logger'),
      types: resolve('./types'),
    } as const;

    // TODO: transpile?
    // const runtimeDir = resolve('./runtime')
    // nuxt.options.build.transpile.push(runtimeDir)

    const runtimeConfig = nuxt.options.runtimeConfig;
    const ENV = process.env;

    // Build-time env var defaults — these set the initial values baked into the
    // runtimeConfig defaults. At server start, Nuxt will override them with the
    // NUXT_PUBLIC_UMAMI_* / NUXT_UMAMI_* environment variables automatically.
    const envHost = ENV.NUXT_UMAMI_HOST || ENV.NUXT_PUBLIC_UMAMI_HOST;
    const envId = ENV.NUXT_UMAMI_ID || ENV.NUXT_PUBLIC_UMAMI_ID;
    const envTag = ENV.NUXT_UMAMI_TAG || ENV.NUXT_PUBLIC_UMAMI_TAG;

    const {
      enabled,
      host,
      id,
      customEndpoint,
      domains,
      proxy,
      logErrors,
      ...runtimeOptions
    } = normalizeConfig({
      ...options,
      ...(isValidString(envId) && { id: envId }),
      ...(isValidString(envHost) && { host: envHost }),
      ...(isValidString(envTag) && { tag: envTag }),
    });

    const endpoint = host ? new URL(host).origin + (customEndpoint || '/api/send') : '';

    const publicConfig = {
      ...runtimeOptions,
      enabled,
      domains,
      website: '',
      endpoint: '',
      mode: 'faux' as ModuleMode,
      logErrors: process.env.NODE_ENV === 'development' || logErrors,
    } satisfies UmPublicConfig;

    const privateConfig: UmPrivateConfig = { endpoint: '', website: '', domains };

    let mode: ModuleMode = 'faux';
    const proxyOpts: Array<NormalizedModuleOptions['proxy']> = ['direct', 'cloak'];

    if (enabled && endpoint && id) {
      // ^ module is enabled && endpoint/id has no errors
      if (proxyOpts.includes(proxy)) {
        // ^ proxy is enabled, requests can be proxied
        if (proxy === 'cloak') {
          // ^ proxy mode: cloak; add API route
          mode = 'proxy';
          addServerHandler({
            route: '/api/savory',
            handler: resolve('./runtime/server/endpoint'),
          });
          // In cloak mode, endpoint/website are server-only — never put in public config.
          // They are overridable at runtime via NUXT_UMAMI_ENDPOINT / NUXT_UMAMI_WEBSITE.
          privateConfig.endpoint = endpoint;
          privateConfig.website = id;
        }
        else if (proxy === 'direct') {
          // ^ proxy mode: direct; add proxy rule
          mode = 'direct';
          // The client hits /api/savory, Nuxt proxies it to the real endpoint.
          // routeRules is a build-time artifact — runtime override of the target
          // URL is not possible in this mode without a rebuild.
          publicConfig.endpoint = '/api/savory';
          publicConfig.website = id;
          nuxt.options.routeRules ||= {};
          nuxt.options.routeRules['/api/savory'] = { proxy: endpoint };
        }
      }
      else {
        // ^ proxy mode: none; direct to Umami
        // endpoint/website go into public runtimeConfig and are overridable at
        // runtime via NUXT_PUBLIC_UMAMI_ENDPOINT / NUXT_PUBLIC_UMAMI_WEBSITE.
        mode = 'direct';
        publicConfig.endpoint = endpoint;
        publicConfig.website = id;
      }
    }
    else {
      // ^ module is disabled || host/id has errors
      if (!id)
        logger.warn('id is missing or incorrectly configured. Check module config.');
      if (!endpoint) {
        logger.warn(
          'Your API endpoint is missing or incorrectly configured. Check `host` and/or `customEndpoint` in module config.',
        );
      }

      logger.info(
        enabled
          ? 'Currently running in test mode due to incorrect/missing options.'
          : 'Umami is disabled.',
      );
    }

    publicConfig.mode = mode;

    // add public config to runtimeConfig — exposed to client and server.
    // Nuxt automatically maps NUXT_PUBLIC_UMAMI_* env vars to these fields at runtime.
    runtimeConfig.public.umami = publicConfig as unknown as typeof runtimeConfig.public.umami;

    // add private config to runtimeConfig — server-only.
    // Nuxt automatically maps NUXT_UMAMI_* env vars to these fields at runtime.
    // Only meaningful in proxy: 'cloak' mode; empty strings otherwise.
    runtimeConfig.umami = privateConfig as unknown as typeof runtimeConfig.umami;

    // generate utils template — only contains collect() (tree-shaken per mode)
    // and buildPathUrl() (urlOptions baked at build time). All config values are
    // read from useRuntimeConfig() at call time inside the template functions.
    addTemplate({
      getContents: generateTemplate,
      filename: 'umami.config.mjs',
      write: true,
      options: {
        mode,
        path: pathTo,
        urlOptions: publicConfig.urlOptions,
        logErrors: publicConfig.logErrors,
      },
    });

    const composables = ['umTrackEvent', 'umTrackView', 'umIdentify', 'umTrackRevenue'];

    // add composables
    addImports(composables.map((name) => {
      return {
        name,
        as: name,
        from: resolve('runtime/composables'),
      };
    }));

    // add auto-track & directive plugin
    addPlugin({
      name: 'nuxt-umami',
      src: resolve('./runtime/plugin'),
      mode: 'all',
    });
  },
});
