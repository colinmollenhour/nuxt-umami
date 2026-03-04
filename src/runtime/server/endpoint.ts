import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, getHeaders, readValidatedBody } from 'h3';
import { ofetch } from 'ofetch';
import { getClientIp } from 'request-ip';
import { parseEventBody } from '../utils';

export default defineEventHandler(async (event) => {
  // validate body
  const result = await readValidatedBody(
    event,
    body => parseEventBody(body),
  );

  // invalid data, throw error
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid data.',
    });
  }

  // grab config and host from runtimeConfig
  const { endpoint, website, domains } = useRuntimeConfig().umami as {
    endpoint: string;
    website: string;
    domains: string[] | null;
  };

  // request headers
  const headers = getHeaders(event);
  const origin = headers.origin;
  const userAgent = headers['user-agent'];
  // Forward the real client IP to Umami so geo-location works correctly
  // when this proxy runs behind a CDN/edge network (Netlify, Vercel, etc.).
  // Prefer the existing X-Forwarded-For chain; fall back to request-ip which
  // handles X-Real-IP, CF-Connecting-IP, and other platform-specific headers.
  const forwardedFor = headers['x-forwarded-for'] || getClientIp(event.node.req) || '';

  // TODO: option to limit access to only user domain, maybe use siteConfig

  if (!origin || (domains && !domains.includes(new URL(origin).hostname))) {
    // disabled by domains
    throw createError({
      statusCode: 403, // forbidden
      statusMessage: 'Invalid origin.',
    });
  }

  try {
    const { payload, cache, type } = result.output;

    return await ofetch<string>(endpoint, {
      method: 'POST',
      headers: {
        ...(cache && { 'x-umami-cache': cache }),
        ...(userAgent && { 'user-agent': userAgent }),
        // Pass the real client IP to Umami for accurate geo-location.
        // Skip in dev (127.0.0.1 confuses Umami's IP parser).
        ...(!import.meta.dev && forwardedFor && { 'x-forwarded-for': forwardedFor }),
      },
      body: {
        type,
        payload: {
          website,
          ...payload,
        },
      },
      credentials: 'omit',
    });
  }
  catch (error) {
    let code = 502; // bad gateway
    let message = 'Unknown error.';

    if (error instanceof Error) {
      message = error.message;

      if ('data' in error && typeof error.data === 'string') {
        message = error.data;
        code = 400;
      }
    }

    throw createError({
      name: 'API Error',
      statusCode: code,
      data: message,
      message,
    });
  }
});
