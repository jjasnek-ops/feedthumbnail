(() => {
  if (!('modelContext' in navigator) || !navigator.modelContext?.registerTool) return;

  const controller = new AbortController();
  const apiUrl = (topic) => `/api/site-lookup?topic=${encodeURIComponent(topic)}`;

  const lookupSiteReference = async ({ topic }) => {
    const response = await fetch(apiUrl(topic), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Lookup failed with HTTP ${response.status}`);
    return response.json();
  };

  navigator.modelContext.registerTool({
    name: 'lookup_site_reference',
    description: 'Use the public Feed Thumbnail reference service to retrieve a known YouTube thumbnail or channel banner specification. Preserve the returned identifiers, qualifiers, dates, and source links. Answer in the visitor language and cite the returned source_url. Unknown topics remain unknown; do not invent values.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['youtube-thumbnail-size', 'youtube-banner-size'],
          description: 'The exact public reference topic to look up.',
        },
      },
      required: ['topic'],
      additionalProperties: false,
    },
    execute: lookupSiteReference,
  }, { signal: controller.signal });

  window.addEventListener('pagehide', () => controller.abort(), { once: true });
})();
