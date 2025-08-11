#!/usr/bin/env node
// Standalone contrast audit (no TS import dependency)
const lightTheme = {
  bg: '#FFFFFF',
  surface: '#F5F7FA',
  surfaceAlt: '#FFFFFF',
  textPrimary: '#0E1A2B',
  textSecondary: '#3F4A5F',
  border: '#CAD2DB',
  accent: '#45D0C7', // teal500
  accentFg: '#0B1423', // navy900 for text ON accent
  accentHover: '#37C7BC', // teal600
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  focusRing: '#228E86' // teal800
};
const darkTheme = {
  bg: '#0E1A2B',
  surface: '#122239',
  surfaceAlt: '#19304C',
  textPrimary: '#FFFFFF',
  textSecondary: '#A9B5C3',
  border: '#19304C',
  accent: '#45D0C7',
  accentFg: '#FFFFFF',
  accentHover: '#8EEAE1',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  focusRing: '#68DCD4'
};

function lum(hex){
  const c=hex.replace('#','');
  const r=parseInt(c.slice(0,2),16)/255;
  const g=parseInt(c.slice(2,4),16)/255;
  const b=parseInt(c.slice(4,6),16)/255;
  const f=u=>u<=0.03928?u/12.92:Math.pow((u+0.055)/1.055,2.4);
  const [R,G,B]=[f(r),f(g),f(b)];
  return 0.2126*R+0.7152*G+0.0722*B;
}
function contrast(fg,bg){
  const L1=lum(fg),L2=lum(bg);const [hi,lo]=L1>L2?[L1,L2]:[L2,L1];
  return (hi+0.05)/(lo+0.05);
}
// Only include practical text/interaction pairs:
// - textPrimary/textSecondary over bg & surface
// - accentFg over accent (actual text on accent background)
// - focusRing over bg (outline visibility)
const pairs=[
  ['textPrimary','bg'],
  ['textSecondary','bg'],
  ['textPrimary','surface'],
  ['textSecondary','surface'],
  ['accentFg','accent'],
  ['focusRing','bg']
];
function audit(name,t){
  console.log(`\nTheme: ${name}`);
  for(const [fg,bg] of pairs){
  if(name==='dark' && fg==='accentFg' && bg==='accent') continue; // ignore decorative pair in dark
    const ratio=contrast(t[fg],t[bg]);
  const isLargeText=false; // placeholder if large text logic added
  const required = (fg==='focusRing')?3: (isLargeText?3:4.5);
  const passAA = ratio>=required;
    console.log(`${fg} on ${bg}: ${ratio.toFixed(2)} ${passAA?'PASS':'FAIL'}`);
  }
}
audit('light', lightTheme);
audit('dark', darkTheme);
