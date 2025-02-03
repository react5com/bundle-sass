# bundle-sass
A rollup plugin to bundle Sass, SCSS, and CSS files and apply PostCSS processing.

## Usage in Rollup
```javascript
plugins: [
  ...
  bundleSass({
    copyFonts: true,
    postfixOptions: {
      plugins: [],
      use: []
    }
  ...
]
```