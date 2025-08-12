module.exports = {
  // Force module parsing so import.meta is allowed even in files without imports
  parserOpts: { sourceType: 'module' },
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta'
  ]
};
