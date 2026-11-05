import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export function normalizeContentDate(value, context) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing content modification date for ${context}.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid content modification date for ${context}: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

export function latestCommittedContentDate(appDir, sourceFiles) {
  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    throw new Error('At least one content source file is required to determine sitemap lastmod.');
  }

  const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: appDir,
    encoding: 'utf8',
  }).trim();
  const relativePaths = [...new Set(sourceFiles)].map((sourceFile) => {
    const relativePath = path.relative(repositoryRoot, sourceFile);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Sitemap content source is outside the repository: ${sourceFile}`);
    }
    return relativePath;
  });

  const shallow = execFileSync('git', ['-C', repositoryRoot, 'rev-parse', '--is-shallow-repository'], {
    encoding: 'utf8',
  }).trim();
  if (shallow === 'true') {
    throw new Error('Cannot determine reliable sitemap lastmod dates from a shallow Git history.');
  }

  const status = execFileSync('git', [
    '-C', repositoryRoot, 'status', '--porcelain', '--', ...relativePaths,
  ], { encoding: 'utf8' });
  if (status.trim()) {
    throw new Error(
      `Cannot determine a committed sitemap lastmod while content sources are modified:\n${status.trim()}`,
    );
  }

  const committedDate = execFileSync('git', [
    '-C', repositoryRoot, 'log', '-1', '--format=%cs', 'HEAD', '--', ...relativePaths,
  ], { encoding: 'utf8' }).trim();
  return normalizeContentDate(committedDate, relativePaths.join(', '));
}

export async function getSitemapContentDates(appDir) {
  const toolSourceFiles = [
    'src/data/toolsData.ts',
    'src/data/toolSeoData.ts',
    'src/data/toolPageContent.ts',
    'src/data/toolPrivacyTranslations.ts',
    'src/data/toolSeoFaqTemplates.json',
    'src/i18n/translations.ts',
    'src/i18n/missingToolTranslations.ts',
    'src/i18n/toolSeoContentTranslations.json',
  ].map((file) => path.join(appDir, file));
  const pluginDir = path.join(appDir, 'src/tools/plugins');
  for (const name of await readdir(pluginDir)) {
    if (name.endsWith('.tsx') && !name.startsWith('_') && !name.startsWith('.')) {
      toolSourceFiles.push(path.join(pluginDir, name));
    }
  }

  const [tools, faq, batch, legal] = await Promise.all([
    latestCommittedContentDate(appDir, toolSourceFiles),
    latestCommittedContentDate(appDir, [
      path.join(appDir, 'src/data/faqData.ts'),
      path.join(appDir, 'src/components/FaqSection.tsx'),
      path.join(appDir, 'src/i18n/faqPageTranslations.json'),
    ]),
    latestCommittedContentDate(appDir, [
      path.join(appDir, 'src/components/BatchQueueView.tsx'),
      path.join(appDir, 'src/i18n/batchQueueTranslations.json'),
      path.join(appDir, 'src/utils/batchEngine.ts'),
    ]),
    latestCommittedContentDate(appDir, [
      path.join(appDir, 'src/data/legalPages.json'),
      path.join(appDir, 'src/i18n/legalPageTranslations.json'),
      path.join(appDir, 'src/i18n/legalInterfaceTranslations.json'),
      path.join(appDir, 'src/components/LegalPage.tsx'),
      path.join(appDir, 'src/components/LegalPageSections.tsx'),
    ]),
  ]);

  return { tools, faq, batch, legal };
}
