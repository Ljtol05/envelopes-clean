module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript')
  ],
  sourceType: 'unambiguous',
};
