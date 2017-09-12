import typescript from 'rollup-plugin-typescript';

let pkg = require('./package.json');

export default {
  entry: 'src/image.component.ts',
  dest: pkg.main,
  format: 'umd',
  moduleName: 'responsive.lazy.loaded.images',
  external: [
      '@angular/core',
  ],
  globals: {
    '@angular/core': 'ng.core',
  },
  plugins: [typescript({typescript: require('typescript')})]
}
