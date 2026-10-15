const ORIGIN = 'https://feedthumbnail.com';
const REVIEWED_ON = '2026-09-13';

const RECORDS = {
  'youtube-thumbnail-size': {
    identifier: 'youtube-thumbnail-size',
    title: 'YouTube thumbnail size',
    summary: 'The public Feed Thumbnail reference for video thumbnail dimensions, ratio, minimum width, and listed formats.',
    page_url: `${ORIGIN}/youtube-thumbnail-size`,
    source_url: 'https://support.google.com/youtubecreatorstudio/answer/72431?co=GENIE.Platform%3DDesktop&hl=en',
    reviewed_on: REVIEWED_ON,
    values: {
      recommended_pixels: '3840 × 2160',
      aspect_ratio: '16:9',
      minimum_width_pixels: 640,
      listed_formats: ['JPG', 'PNG'],
      qualifier: 'The reference page keeps YouTube\'s wording that JPG and PNG are examples of listed formats.'
    }
  },
  'youtube-banner-size': {
    identifier: 'youtube-banner-size',
    title: 'YouTube channel banner size',
    summary: 'The public Feed Thumbnail reference for channel-banner canvas, safe area, TV recommendation, and file-size limit.',
    page_url: `${ORIGIN}/youtube-banner-size`,
    source_url: 'https://support.google.com/youtube/answer/10456525?hl=en',
    reviewed_on: REVIEWED_ON,
    values: {
      minimum_upload_pixels: '2048 × 1152',
      aspect_ratio: '16:9',
      safe_area_at_minimum_pixels: '1235 × 338',
      recommended_for_tv_pixels: '2560 × 1440',
      file_size_limit: '6 MB or less',
      qualifier: 'The reference page says device views crop the same banner differently and does not publish fixed numeric crop edges.'
    }
  }
};

const TOPICS = Object.keys(RECORDS);
const JSON_PATHS = new Set([
  '/openapi.json',
  '/.well-known/api-catalog',
  '/.well-known/ai-catalog.json',
  '/.well-known/mcp/server-card.json',
  '/.well-known/agent-skills/index.json',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
  '/.well-known/oauth-protected-resource',
  '/.well-known/jwks.json'
]);
const MARKDOWN_PATHS = new Set(['/auth.md', '/ai/skills/site-lookup/SKILL.md']);

function jsonResponse(body, status = 200, extra = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
    ...extra
  });
  return new Response(JSON.stringify(body, null, 2), { status, headers });
}

function textResponse(body, status = 200, contentType = 'text/plain; charset=utf-8', extra = {}) {
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=300',
    ...extra
  });
  return new Response(body, { status, headers });
}

function acceptsMarkdown(request) {
  return (request.headers.get('Accept') || '')
    .toLowerCase()
    .split(',')
    .some((value) => value.trim().split(';')[0] === 'text/markdown');
}

function discoveryLinkHeader() {
  return [
    `<${ORIGIN}/.well-known/api-catalog>; rel="api-catalog"`,
    `<${ORIGIN}/openapi.json>; rel="service-desc"`,
    `<${ORIGIN}/ai/>; rel="service-doc"`,
    `<${ORIGIN}/.well-known/ai-catalog.json>; rel="describedby"; type="application/json"`
  ].join(', ');
}

function withHomepageDiscoveryHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  headers.set('Vary', 'Accept');
  if (pathname === '/') headers.set('Link', discoveryLinkHeader());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function siteMarkdown(pathname) {
  if (pathname === '/') {
    return `# Feed Thumbnail\n\nFeed Thumbnail is a browser-based toolkit for previewing, downloading, making, and reading YouTube thumbnail and channel-banner references.\n\n## Public lookup\n\n- [YouTube thumbnail size](${ORIGIN}/youtube-thumbnail-size)\n- [YouTube banner size](${ORIGIN}/youtube-banner-size)\n- [Bounded lookup API](${ORIGIN}/api/site-lookup?topic=youtube-thumbnail-size)\n- [Site lookup skill](${ORIGIN}/ai/skills/site-lookup/SKILL.md)\n\nThe lookup service supports exactly two topics, is read-only, does not fetch arbitrary URLs, and keeps source links and review dates in every record.\n`;
  }
  if (pathname === '/youtube-thumbnail-size') {
    return `# YouTube thumbnail size\n\nUse the [Feed Thumbnail reference](${ORIGIN}/youtube-thumbnail-size) for the public record.\n\n- Recommended pixels: 3840 × 2160\n- Aspect ratio: 16:9\n- Minimum width: 640 pixels\n- Listed formats: JPG and PNG\n- Source: https://support.google.com/youtubecreatorstudio/answer/72431?co=GENIE.Platform%3DDesktop&hl=en\n`;
  }
  if (pathname === '/youtube-banner-size') {
    return `# YouTube channel banner size\n\nUse the [Feed Thumbnail reference](${ORIGIN}/youtube-banner-size) for the public record.\n\n- Minimum upload: 2048 × 1152 pixels\n- Aspect ratio: 16:9\n- Safe area at minimum: 1235 × 338 pixels\n- Recommended for TV: 2560 × 1440 pixels\n- File size: 6 MB or less\n- Source: https://support.google.com/youtube/answer/10456525?hl=en\n`;
  }
  return `# Feed Thumbnail\n\nSee the [homepage](${ORIGIN}/) for the public tools and references.\n`;
}

function lookup(topic) {
  return RECORDS[topic] || null;
}

function lookupResponse(topic) {
  const record = lookup(topic);
  if (!record) return jsonResponse({ error: 'not_found', available_topics: TOPICS }, 404);
  return jsonResponse(record);
}

function mcpTools() {
  return [{
    name: 'site_lookup',
    description: '::ILANG:: Retrieve one of the two bounded public Feed Thumbnail references. Preserve identifiers, qualifiers, reviewed_on, page_url, and source_url; answer in the visitor language; keep absent facts unknown. No arbitrary URL fetch or write operation.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: TOPICS,
          description: 'Exact supported topic identifier.'
        }
      },
      required: ['topic'],
      additionalProperties: false
    }
  }];
}

function mcpResponse(id, result) {
  return jsonResponse({ jsonrpc: '2.0', id, result }, 200, {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
}

function mcpError(id, code, message, data) {
  return jsonResponse({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } }, 200, {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
}

async function handleMcp(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type, mcp-session-id, accept',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }});
  }
  if (request.method === 'GET') return jsonResponse({ name: 'feedthumbnail-site-lookup', endpoint: `${ORIGIN}/mcp`, capabilities: { tools: {} } });
  if (request.method !== 'POST') return mcpError(null, -32600, 'Only JSON-RPC POST is supported.');
  let body;
  try { body = await request.json(); } catch { return mcpError(null, -32700, 'Invalid JSON.'); }
  const id = body.id ?? null;
  if (body.method === 'notifications/initialized') return new Response(null, { status: 202, headers: { 'Access-Control-Allow-Origin': '*' } });
  if (body.method === 'initialize') {
    return mcpResponse(id, {
      protocolVersion: body.params?.protocolVersion || '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'feedthumbnail-site-lookup', version: '1.0.0' },
      instructions: '::ILANG:: Use tools/list then site_lookup. Preserve source_url and reviewed_on. Unknown topics remain unknown.'
    });
  }
  if (body.method === 'tools/list') return mcpResponse(id, { tools: mcpTools() });
  if (body.method === 'tools/call') {
    if (body.params?.name !== 'site_lookup') return mcpError(id, -32602, 'Unknown tool.', { available_tools: ['site_lookup'] });
    const topic = body.params?.arguments?.topic;
    const record = lookup(topic);
    if (!record) {
      return mcpResponse(id, {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ error: 'not_found', available_topics: TOPICS }) }]
      });
    }
    return mcpResponse(id, {
      content: [{ type: 'text', text: JSON.stringify(record) }],
      structuredContent: record,
      isError: false
    });
  }
  return mcpError(id, -32601, 'Method not found.');
}

function constructionResponse() {
  return jsonResponse({
    status: 'under_construction',
    available: false,
    capabilities_status: 'planned_contract_only',
    error: 'temporarily_unavailable',
    error_description: 'Coming soon. No registration or token issuance is available. Use the public lookup service.'
  }, 503, { 'Cache-Control': 'no-store' });
}

async function serveMetadata(pathname, request, env) {
  const asset = await env.ASSETS.fetch(request);
  const headers = new Headers(asset.headers);
  if (JSON_PATHS.has(pathname)) headers.set('Content-Type', pathname === '/.well-known/api-catalog' ? 'application/linkset+json' : 'application/json; charset=utf-8');
  if (MARKDOWN_PATHS.has(pathname)) headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Vary', 'Accept');
  return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
}

async function fetch(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/api/site-lookup') {
    if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405, { Allow: 'GET' });
    return lookupResponse(url.searchParams.get('topic'));
  }
  if (pathname === '/mcp') return handleMcp(request);
  if (pathname.startsWith('/agent-auth/')) return constructionResponse();
  if (JSON_PATHS.has(pathname) || MARKDOWN_PATHS.has(pathname)) return serveMetadata(pathname, request, env);
  if (pathname === '/ai/index.ilang' || pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  }
  if (acceptsMarkdown(request)) {
    const body = siteMarkdown(pathname);
    return textResponse(body, 200, 'text/markdown; charset=utf-8', {
      'x-markdown-tokens': String(Math.ceil(body.length / 4)),
      'Vary': 'Accept',
      'Link': pathname === '/' ? discoveryLinkHeader() : ''
    });
  }

  const assetResponse = await env.ASSETS.fetch(request);
  return withHomepageDiscoveryHeaders(assetResponse, pathname);
}

export default { fetch };
