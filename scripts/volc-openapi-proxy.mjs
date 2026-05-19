import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://127.0.0.1:4173';
function writeCors(res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  writeCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function isAllowedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    writeCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/volc-openapi') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const { url, method = 'POST', headers = {}, body = '' } = payload;

    if (!isAllowedUrl(url)) {
      sendJson(res, 400, {
        error: 'Only HTTPS endpoints are allowed',
      });
      return;
    }

    const upstream = await fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : body,
    });
    const text = await upstream.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
      // Keep non-JSON responses as text.
    }

    sendJson(res, upstream.status, {
      ok: upstream.ok,
      status: upstream.status,
      statusText: upstream.statusText,
      data,
    });
  } catch (err) {
    sendJson(res, 500, { error: err.message || String(err) });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Volcengine OpenAPI proxy listening on http://127.0.0.1:${port}/volc-openapi`);
});
