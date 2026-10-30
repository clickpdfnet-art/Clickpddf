const GENERATED_COMMENT_PATTERN = /<!--\s*Generated sitemap:[\s\S]*?-->/;

export function setGeneratedSitemapComment(sitemap, comment) {
  if (GENERATED_COMMENT_PATTERN.test(sitemap)) {
    return sitemap.replace(GENERATED_COMMENT_PATTERN, comment);
  }

  const firstUrlIndex = sitemap.indexOf('  <url>');
  if (firstUrlIndex < 0) {
    throw new Error('Cannot add the generated sitemap summary without a URL entry.');
  }

  return `${sitemap.slice(0, firstUrlIndex)}${comment}\n${sitemap.slice(firstUrlIndex)}`;
}
