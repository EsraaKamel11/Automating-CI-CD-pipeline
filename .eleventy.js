require('dotenv').config();

const { execSync } = require('child_process');
const dateFilter = require('./src/filters/date-filter.js');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const htmlMinTransform = require('./src/transforms/html-min-transform.js');
const isProduction = process.env.NODE_ENV === 'production';
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const pluginTOC = require('eleventy-plugin-toc');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const w3DateFilter = require('./src/filters/w3-date-filter.js');
const parentFilter = require('./src/filters/parent-filter.js');
const markdownRenderShortcode = require('./src/shortcodes/markdown-render.js');
const svgIconShortcode = require('./src/shortcodes/svg-icon.js');
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = config => {
  // Add filters
  config.addFilter('dateFilter', dateFilter);
  config.addFilter('w3DateFilter', w3DateFilter);
  config.addFilter('parentFilter', parentFilter);
  config.addFilter('debugger', (...args) => {
    console.log(...args);
    debugger;
  });

  // Add plugins
  config.addPlugin(eleventyNavigationPlugin);
  config.addPlugin(syntaxHighlight);
  config.addPlugin(pluginTOC);
  config.addPlugin(EleventyHtmlBasePlugin);

  // Passthrough copy for static assets
  config.addPassthroughCopy({ './src/robots.txt': '/robots.txt' });
  config.addPassthroughCopy('./src/img/**');
  config.addPassthroughCopy('./src/css/**');  // Ensure CSS is passed through
  config.addPassthroughCopy('./src/js/**');
  config.addPassthroughCopy('./src/font/**');

  // Add a collection for posts, sorted by navigation order
  config.addCollection('posts', collection => {
    const items = collection.getFilteredByGlob('./src/posts/**/posts/*.md');
    return items.sort((a, b) => a.data.eleventyNavigation.order - b.data.eleventyNavigation.order);
  });

  // Add shortcodes
  config.addAsyncShortcode('svgIcon', svgIconShortcode);
  config.addAsyncShortcode('markdownRender', markdownRenderShortcode);

  // Minify HTML in production
  if (isProduction) {
    config.addTransform('htmlmin', htmlMinTransform);
  }

  // Configure markdown library
  const markdownLib = markdownIt({ html: true }).use(
    markdownItAnchor,
    {
      permalink: true,
      permalinkClass: 'anchor',
      permalinkSymbol: '#'
    }
  );
  config.setLibrary('md', markdownLib);

  // Run Pagefind after Eleventy build
  config.on('eleventy.after', () => {
    execSync(`npx pagefind --source _site --glob \"**/*.html\"`, { encoding: 'utf-8' });
  });

  // Set the path prefix for GitHub Pages or other subdirectory deployments
  const pathPrefix = process.env.PATH_PREFIX || '/';

  // Return the Eleventy config object
  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: '_site'
    },
    passthroughFileCopy: true,
    pathPrefix: pathPrefix,  // Use pathPrefix for assets
  };
};
