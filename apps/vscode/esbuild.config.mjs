import esbuild from 'esbuild';

const context = await esbuild.context({
  entryPoints: ['extension.js'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  minify: process.argv.includes('--minify'),
  sourcemap: process.argv.includes('--sourcemap'),
});

await context.rebuild();
context.watch();
