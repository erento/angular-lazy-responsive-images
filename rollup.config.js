import typescript from 'rollup-plugin-typescript';
import angular from 'rollup-plugin-angular';
import sass from 'node-sass';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier';

const pkg = require('./package.json');

const cssmin = new CleanCSS();
const htmlminOpts = {
  caseSensitive: true,
  collapseWhitespace: true,
  removeComments: true,
};

export default {
  entry: 'src/index.ts',
  dest: pkg.main,
  format: 'umd',
  moduleName: 'responsive.lazy.loaded.images',
  external: [
    '@angular/core',
  ],
  globals: {
    '@angular/core': 'ng.core',
  },
  plugins: [
  angular({
    preprocessors: {
      template: template => minifyHtml(template, htmlminOpts),
      style: scss => {
        const css = sass.renderSync({ data: scss }).css;
        return cssmin.minify(css).styles;
      },
    }
  }),
  typescript({typescript: require('typescript')}),
  ],
}
