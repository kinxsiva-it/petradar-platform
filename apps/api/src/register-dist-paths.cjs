const Module = require('node:module');
const path = require('node:path');

const originalResolveFilename = Module._resolveFilename;
const repoRoot = path.resolve(__dirname, '../../..');

Module._resolveFilename = function resolveWorkspaceAlias(request, parent, isMain, options) {
  const backendMatch = /^@petradar\/backend\/([^/]+)$/.exec(request);

  if (backendMatch) {
    return path.join(
      repoRoot,
      'dist',
      'apps',
      'api',
      'libs',
      'backend',
      backendMatch[1],
      'src',
      'index.js',
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
