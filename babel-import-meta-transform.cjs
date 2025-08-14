// Simple Babel plugin to rewrite `import.meta` references (used for Vite env) to a
// plain object exposing process.env during Jest tests (CommonJS execution).
// This avoids runtime SyntaxError: Cannot use 'import.meta' outside a module.
module.exports = function importMetaTransform() {
  return {
    name: 'import-meta-to-process-env',
    visitor: {
      MetaProperty(path) {
        if (path.node.meta && path.node.property && path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          // Replace with an object literal whose `env` points at process.env
          path.replaceWithSourceString('({ env: (typeof process !== "undefined" ? process.env : {}) })');
        }
      }
    }
  };
};
