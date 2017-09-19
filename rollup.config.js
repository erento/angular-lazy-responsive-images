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
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    format: 'umd'
  },
  name: 'responsive.lazy.loaded.images',
  external: [
    '@angular/core',
    '@angular/common',
  ],
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
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
