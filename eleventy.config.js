import { IdAttributePlugin, InputPathToUrlTransformPlugin, EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { execSync } from 'child_process';
import pluginFilters from "./_config/filters.js";
import PurgeCSS from 'purgecss';
import markdownIt from 'markdown-it';
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";
import markdownItFootnote from "markdown-it-footnote";
import pluginTOC from 'eleventy-plugin-toc';
import yaml from "js-yaml";

function createMemoizedRenderer(renderFn) {
  const cache = new Map();
  return (content) => {
    if (cache.has(content)) return cache.get(content);
    const result = renderFn(content);
    cache.set(content, result);
    return result;
  };
}

export default async function(eleventyConfig) {
  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));

  eleventyConfig.addPassthroughCopy({ "./public/": "/" });
  eleventyConfig.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") return false;
  });

  eleventyConfig.addTransform('purge-and-inline-css', async (content, outputPath) => {
    if (process.env.ELEVENTY_ENV !== 'production' || !outputPath?.endsWith('.html')) return content;
    const results = await new PurgeCSS().purge({
      content: [{ raw: content }],
      css: ['dist/css/index.css', 'dist/css/outcome.css'],
      keyframes: true,
    });
    return content.replace('<!-- INLINE CSS-->', `<style>${results[0].css}</style>`);
  });

  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  })
    .use(markdownItAttrs)
    .use(markdownItFootnote)
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: "after",
        class: "header-anchor",
        symbol: "",
        ariaHidden: false,
      }),
      level: [1, 2, 3, 4],
      slugify: eleventyConfig.getFilter("slugify"),
    });

  const defaultImageRule = markdownLib.renderer.rules.image || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
  markdownLib.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (!token.attrGet("loading")) token.attrSet("loading", "lazy");
    if (!token.attrGet("decoding")) token.attrSet("decoding", "async");
    return defaultImageRule(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", markdownLib);

  const renderMd = createMemoizedRenderer((content) => markdownLib.render(content || ""));
  eleventyConfig.addFilter("md", (content) => renderMd(content || ""));
  eleventyConfig.addFilter("markdownify", (content) => renderMd(content || ""));
  eleventyConfig.addFilter("markdown", (content) => markdownLib.render(content || ""));
  eleventyConfig.addFilter("min", (...numbers) => Math.min(...numbers));

  eleventyConfig.addBundle("css", { toFileDirectory: "dist" });
  eleventyConfig.addBundle("js", { toFileDirectory: "dist" });

  eleventyConfig.addPlugin(pluginSyntaxHighlight, { preAttributes: { tabindex: 0 } });
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
  eleventyConfig.addPlugin(pluginFilters);

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed/feed.xml",
    stylesheet: "pretty-atom-feed.xsl",
    templateData: {
      eleventyNavigation: {
        key: "Feed",
        order: 4
      }
    },
    collection: {
      name: "posts",
      limit: 10,
    },
    metadata: {
      language: "en",
      title: "11ty",
      subtitle: "11ty site",
      base: "https://example.com",
      author: { name: "Adam DJ Brett" }
    }
  });

  eleventyConfig.addPlugin(pluginTOC, {
    tags: ["h2", "h3", "h4", "h5"],
    id: "toci",
    class: "list-group",
    ul: true,
    flat: true,
    wrapper: "div",
  });

  eleventyConfig.addPlugin(IdAttributePlugin);
  eleventyConfig.addShortcode("currentBuildDate", () => new Date().toISOString());

  eleventyConfig.on('eleventy.after', () => {
    execSync(`npx pagefind --source _site --glob "**/*.html"`, { encoding: 'utf-8' });
  });
}

export const config = {
  templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
  dir: {
    input: "content",
    includes: "../_includes",
    data: "../_data",
    output: "_site"
  },
};