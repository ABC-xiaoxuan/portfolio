import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

/*
 * Toolchain note
 * --------------
 * The build is Rollup + Babel only — no esbuild, no child processes.
 * Production output is ES modules with code splitting: the page shell ships
 * in app.js, while three.js (hero NURBS surface and page backdrop) is a dynamic
 * import that loads only when the browser has WebGL.
 * `runtime: 'automatic'` means no `import React` boilerplate in every component.
 */
export default {
  input: 'src/main.jsx',
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'app.js',
    chunkFileNames: 'chunks/[name]-[hash].js',
    // Both WebGL scenes share one three.js chunk; name it after what it is.
    manualChunks: (id) => (/[\\/]node_modules[\\/]three[\\/]/.test(id) ? 'three' : undefined),
    assetFileNames: '[name][extname]',
    generatedCode: 'es2015',
  },
  // jsdom cannot run module scripts, so the smoke test gets a single classic
  // script with every dynamic import inlined.
  smokeOutput: {
    file: '.smoke/app.js',
    format: 'iife',
    inlineDynamicImports: true,
    generatedCode: 'es2015',
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    resolve({ extensions: ['.js', '.jsx'] }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx'],
      // Dependencies ship compiled JS; transforming three.js through Babel
      // only slowed the build down.
      exclude: /node_modules/,
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-react', { runtime: 'automatic', development: false }]],
    }),
    terser({ maxWorkers: 1, format: { comments: false } }),
  ],
}
