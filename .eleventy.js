module.exports = function(eleventyConfig) {
  // Copy `css/`, `js/`, and `images/` to the output folder
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");

  // Default to "/" for local dev
  const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    pathPrefix
  };
};