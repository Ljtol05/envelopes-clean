module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript')
  ],
  plugins: [
    require.resolve('@babel/plugin-syntax-import-meta'),
    // Local plugin to rewrite import.meta for Jest (CJS) execution
    require.resolve('./babel-import-meta-transform.cjs')
  ],
  sourceType: 'unambiguous'
};
