const MAX_REPORT_BYTES = 64 * 1024;

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_REPORT_BYTES) {
        reject(new Error('CSP report payload exceeds 64 KiB limit'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const rawBody = await readRequestBody(request);
    const report = rawBody ? JSON.parse(rawBody) : null;
    const payload = report?.['csp-report'] ?? report;

    console.warn('CSP violation report received', {
      blockedUri: payload?.blockedUri ?? payload?.['blocked-uri'] ?? 'unknown',
      effectiveDirective: payload?.effectiveDirective ?? payload?.['effective-directive'] ?? 'unknown',
      violatedDirective: payload?.violatedDirective ?? payload?.['violated-directive'] ?? 'unknown',
      disposition: payload?.disposition ?? 'unknown',
    });

    response.status(204).end();
  } catch (error) {
    console.warn('Invalid CSP violation report received', error);
    response.status(400).json({ error: 'Invalid CSP report payload' });
  }
};
