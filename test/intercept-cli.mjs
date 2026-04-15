// Patch global fetch to log all requests before passing through
const originalFetch = globalThis.fetch;
globalThis.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input?.url;
  if (url && url.includes('portal.qwen')) {
    console.error('\n=== INTERCEPTED FETCH TO portal.qwen ===');
    console.error('URL:', url);
    console.error('Method:', init?.method);
    const headers = init?.headers;
    if (headers) {
      console.error('Headers:', JSON.stringify(Object.fromEntries(
        headers instanceof Headers 
          ? headers.entries() 
          : Object.entries(headers)
      ), null, 2));
    }
    if (init?.body) {
      try {
        const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        const summary = { model: body.model, messageCount: body.messages?.length, hasTools: !!body.tools, topKeys: Object.keys(body) };
        console.error('Body summary:', JSON.stringify(summary, null, 2));
      } catch {}
    }
    console.error('=== END INTERCEPT ===\n');
  }
  return originalFetch.call(this, input, init);
};

// Load the CLI
await import('file:///C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js');
