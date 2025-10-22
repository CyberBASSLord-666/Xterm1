import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '120s', target: 500 },
        { duration: '300s', target: 500 },
        { duration: '60s', target: 0 }
      ],
      gracefulRampDown: '30s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.02']
  }
};

const BASE_URL = __ENV.POLLIWALL_BASE_URL || 'https://polliwall.app';
const API_KEY = __ENV.POLLIWALL_GEMINI_KEY || 'sandbox-key';

const prompts = [
  'Hyper-detailed matte painting of a neon-lit rainforest with bioluminescent fauna',
  'Cinematic ultra-wide shot of a cyberpunk Osaka skyline during monsoon',
  'Photorealistic macro capture of frost-covered leaves at sunrise',
  'Analog film look spacewalk above Europa with volumetric lighting'
];

export default function loadTest() {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  group('queue request', () => {
    const payload = JSON.stringify({
      prompt,
      width: 1920,
      height: 1080,
      options: {
        model: 'flux-pro-1.1',
        guidance: 7.5,
        seed: Math.floor(Math.random() * 100000)
      }
    });

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY
    };

    const response = http.post(`${BASE_URL}/api/generate`, payload, { headers });

    check(response, {
      'status is 200 or 202': (res) => res.status === 200 || res.status === 202,
      'response time under 1.2s': (res) => res.timings.duration < 1200
    });

    if (response.status === 429) {
      throttled.add(1);
    }

    sleep(1 + Math.random() * 2);
  });
}

const throttled = new Counter('polliwall_throttled_requests');
