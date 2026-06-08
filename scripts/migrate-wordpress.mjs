import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawRoot = path.join(root, "RAW", "wildglobalization.com");
const pagesDir = path.join(rawRoot, "wp-json", "wp", "v2", "pages");
const srcDir = path.join(root, "src");
const outputDir = path.join(srcDir, "pages");
const assetsDir = path.join(srcDir, "assets", "img");

const pageOrder = [
  "about",
  "welcome",
  "wild-ecology",
  "wild-sex",
  "wild-tech",
  "wild-value",
  "wild-governance",
  "hints",
  "opening-act",
  "chapter-1-summary",
  "g-2-0-settlingcultivating-the-neolithic-10000-bce-to-32-ce",
  "about-2"
];

const slugToPermalink = {
  about: "/",
  welcome: "/welcome/",
  "wild-ecology": "/wild-ecology/",
  "wild-sex": "/wild-sex/",
  "wild-tech": "/wild-tech/",
  "wild-value": "/wild-value/",
  "wild-governance": "/wild-governance/",
  hints: "/hints/",
  "opening-act": "/opening-act/",
  "chapter-1-summary": "/chapter-1-summary/",
  "g-2-0-settlingcultivating-the-neolithic-10000-bce-to-32-ce": "/g-2-0-settlingcultivating-the-neolithic-10000-bce-to-32-ce/",
  "about-2": "/about-2/"
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function decodeEntities(value) {
  return value
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8220;/g, "\"")
    .replace(/&#8221;/g, "\"")
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function frontmatterString(value) {
  return `"${decodeEntities(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

function localAssetPathFromUrl(url) {
  const normalized = url
    .replace(/^https?:\/\/wildglobalization\.com\//, "")
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\//, "");

  const uploadPrefix = "wp-content/uploads/";
  const themePrefix = "wp-content/themes/hestia/assets/img/";

  if (normalized.startsWith(uploadPrefix)) {
    return normalized.slice(uploadPrefix.length);
  }

  if (normalized.startsWith(themePrefix)) {
    return path.basename(normalized);
  }

  return null;
}

function copyAsset(relativeAsset) {
  const uploadSource = path.join(rawRoot, "wp-content", "uploads", relativeAsset);
  const themeSource = path.join(rawRoot, "wp-content", "themes", "hestia", "assets", "img", relativeAsset);
  const source = fs.existsSync(uploadSource) ? uploadSource : themeSource;

  if (!fs.existsSync(source)) {
    return false;
  }

  const destination = path.join(assetsDir, relativeAsset);
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
  return true;
}

function collectAssetUrls(html) {
  const urls = new Set();
  const patterns = [
    /(?:src|href)=["']([^"']*wp-content\/uploads\/[^"']+)["']/g,
    /srcset=["']([^"']+)["']/g,
    /url\(([^)]+wp-content\/uploads\/[^)]+)\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      if (pattern.source.startsWith("srcset")) {
        for (const part of match[1].split(",")) {
          const [candidate] = part.trim().split(/\s+/);
          if (candidate) urls.add(candidate);
        }
      } else {
        urls.add(match[1].trim().replace(/^["']|["']$/g, ""));
      }
    }
  }

  return urls;
}

function rewriteContent(html) {
  let output = html;

  output = output.replace(/https?:\/\/wildglobalization\.com\/wp-content\/uploads\//g, "/assets/img/");
  output = output.replace(/https?:\/\/wildglobalization\.com(?=\/)/g, "");
  output = output.replace(/(\.\.\/)+wp-content\/uploads\//g, "/assets/img/");
  output = output.replace(/wp-content\/uploads\//g, "/assets/img/");
  output = output.replace(/<iframe([^>]+)><\/iframe>/g, '<span class="video-wrapper"><iframe$1></iframe></span>');
  output = output.replace(/\sclass="[^"]*coblocks-animate[^"]*"/g, (classAttr) => {
    const clean = classAttr
      .replace(/\bcoblocks-animate\b/g, "")
      .replace(/\sdata-coblocks-animation="[^"]*"/g, "")
      .replace(/\s+/g, " ")
      .replace('class=" ', 'class="')
      .replace(/ "\s*$/, '"');
    return clean === ' class=""' ? "" : clean;
  });
  output = output.replace(/\sdata-coblocks-animation="[^"]*"/g, "");
  output = output.replace(/\sloading="lazy"/g, " loading=\"lazy\"");
  output = output.replace(/<p>\s*<\/p>/g, "");

  return output.trim();
}

function writePage(page) {
  const slug = page.slug;
  const permalink = slugToPermalink[slug];
  const title = decodeEntities(page.title.rendered);
  const content = rewriteContent(page.content.rendered || "");
  const isHome = slug === "about";
  const filename = isHome ? "index.html" : `${slug}.html`;
  const target = path.join(outputDir, filename);
  const body = `---
layout: page.njk
title: ${frontmatterString(title)}
permalink: ${permalink}
isHome: ${isHome ? "true" : "false"}
---
${content}
`;

  fs.writeFileSync(target, body);
}

ensureDir(outputDir);
ensureDir(assetsDir);

fs.copyFileSync(path.join(root, "logo.png"), path.join(assetsDir, "logo.png"));

const requiredAssets = [
  "2023/11/tooury_photograph_of_a_large_imposing_black_obelisk_in_a_canyon_4caa5516-b627-4a97-8827-07acbccf9259-scaled.webp",
  "2023/11/cropped-The-Wild-Globalization-Project-Profile-Picture-32x32.png",
  "2023/11/cropped-The-Wild-Globalization-Project-Profile-Picture-180x180.png",
  "parallax_1.jpg",
  "parallax_2.png"
];

for (const asset of requiredAssets) {
  copyAsset(asset);
}

fs.copyFileSync(
  path.join(assetsDir, "2023/11/tooury_photograph_of_a_large_imposing_black_obelisk_in_a_canyon_4caa5516-b627-4a97-8827-07acbccf9259-scaled.webp"),
  path.join(assetsDir, "page-hero.webp")
);
fs.copyFileSync(
  path.join(assetsDir, "2023/11/cropped-The-Wild-Globalization-Project-Profile-Picture-32x32.png"),
  path.join(assetsDir, "favicon-32.png")
);
fs.copyFileSync(
  path.join(assetsDir, "2023/11/cropped-The-Wild-Globalization-Project-Profile-Picture-180x180.png"),
  path.join(assetsDir, "favicon-180.png")
);

const pages = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(pagesDir, file), "utf8")))
  .filter((page) => pageOrder.includes(page.slug))
  .sort((a, b) => pageOrder.indexOf(a.slug) - pageOrder.indexOf(b.slug));

const assetUrls = new Set();
for (const page of pages) {
  for (const url of collectAssetUrls(page.content.rendered || "")) {
    assetUrls.add(url);
  }
}

for (const url of assetUrls) {
  const relativeAsset = localAssetPathFromUrl(url);
  if (relativeAsset) copyAsset(relativeAsset);
}

for (const page of pages) {
  writePage(page);
}

console.log(`Migrated ${pages.length} pages and ${assetUrls.size + requiredAssets.length + 1} asset references.`);
