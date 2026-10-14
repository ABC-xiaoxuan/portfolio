import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

/*
 * Toolchain note
 * --------------
 * The build is Rollup + Babel only — no esbuild, no child processes.
 * Output is a classic IIFE script, so dist/index.html can even be opened
 * straight from disk. `runtime: 'automatic'` means no `import React`
 * boilerplate in every component.
 */
export default {
  input: 'src/main.jsx',
  output: {
    dir: 'dist',
    format: 'iife',
    entryFileNames: 'app.js',
    assetFileNames: '[name][extname]',
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
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-react', { runtime: 'automatic', development: false }]],
    }),
    terser({ maxWorkers: 1, format: { comments: false } }),
  ],
}
