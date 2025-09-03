module.exports = function(eleventyConfig) {
  // Copy `css/`, `js/`, and `images/` to the output folder
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};