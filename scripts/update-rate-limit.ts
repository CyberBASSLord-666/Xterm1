#!/usr/bin/env ts-node
import { exit } from 'process';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const rateLimitId = process.env.CLOUDFLARE_RATE_LIMIT_ID;
const limitPerMinute = Number(process.argv[2] ?? '120');

if (!accountId || !apiToken || !zoneId || !rateLimitId) {
  console.error('CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, and CLOUDFLARE_RATE_LIMIT_ID must be set.');
  exit(1);
}

const payload = {
  enabled: true,
  action: 'challenge',
  threshold: limitPerMinute,
  period: 60,
  match: {
    request: {
      methods: ['POST'],
      schemes: ['HTTPS'],
      url: '/api/generate'
    }
  }
};

async function updateRateLimit(): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/rate_limits/${process.env.CLOUDFLARE_RATE_LIMIT_ID}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`
      },
      body: JSON.stringify(payload)
    }
  );

  const body = await response.json();
  if (!response.ok) {
    console.error('Failed to update rate limit', body);
    exit(1);
  }

  console.log('Updated rate limit', body.result?.threshold ?? limitPerMinute);
}

updateRateLimit().catch((error) => {
  console.error('Unexpected error updating rate limit', error);
  exit(1);
});
