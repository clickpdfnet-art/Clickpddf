import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const blogDir = path.join(appDir, 'src', 'blogs');
const publicDir = path.join(appDir, 'public');
const outputDir = path.join(publicDir, 'blog-assets', 'watermarked');
const mapPath = path.join(appDir, 'src', 'data', 'blogWatermarkMap.json');
const logoPath = path.join(publicDir, 'icon.svg');
const fallbackCover = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';
const maxInputBytes = 20 * 1024 * 1024;
const forceRefresh = process.argv.includes('--refresh');
const outputWidth = 1200;
const outputHeight = 630;
const watermarkPipelineVersion = 'v1';

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) return [];
    const key = line.slice(0, separator).trim().toLowerCase().replace(/[\s_-]+/g, '');
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return [[key, value]];
  }));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadImage(source) {
  if (source.startsWith('/') && !source.startsWith('//')) {
    const localPath = path.resolve(publicDir, source.slice(1));
    if (!localPath.startsWith(`${publicDir}${path.sep}`)) {
      throw new Error(`Blog cover path escapes the public directory: ${source}`);
    }
    return readFile(localPath);
  }

  const url = new URL(source);
  if (url.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) {
    throw new Error(`Blog cover URL must use a public HTTPS host: ${source}`);
  }

  const response = await fetch(url, {
    headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Could not fetch blog cover (${response.status}): ${source}`);
  if (!response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error(`Blog cover URL did not return an image: ${source}`);
  }
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxInputBytes) throw new Error(`Blog cover exceeds ${maxInputBytes} bytes: ${source}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxInputBytes) {
    throw new Error(`Blog cover has an invalid size: ${source}`);
  }
  return bytes;
}

async function createWatermarkedImage(source, logoSvg) {
  const input = await loadImage(source);
  const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate();
  const metadata = await base.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Could not read dimensions for blog cover: ${source}`);

  const logoSize = 120;
  const margin = 24;
  const logo = await sharp(logoSvg)
    .resize({ width: logoSize, height: logoSize, fit: 'contain' })
    .png()
    .toBuffer();
  const left = outputWidth - logoSize - margin;
  const top = outputHeight - logoSize - margin;
  const contentHash = createHash('sha256')
    .update(watermarkPipelineVersion)
    .update(input)
    .update(logoSvg)
    .digest('hex')
    .slice(0, 20);
  const fileName = `${contentHash}.webp`;
  const outputPath = path.join(outputDir, fileName);
  const publicUrl = `/blog-assets/watermarked/${fileName}`;

  if (!await fileExists(outputPath)) {
    await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(outputWidth, outputHeight, { fit: 'cover', position: sharp.strategy.attention })
      .composite([{ input: logo, left, top }])
      .webp({ quality: 86, effort: 5, smartSubsample: true })
      .toFile(outputPath);
  }

  return publicUrl;
}

const blogFiles = (await readdir(blogDir)).filter((fileName) => fileName.endsWith('.md')).sort();
const sources = new Set([fallbackCover]);
const unwatermarkedSources = new Set();
for (const fileName of blogFiles) {
  const raw = await readFile(path.join(blogDir, fileName), 'utf8');
  const frontmatter = parseFrontmatter(raw);
  const source = frontmatter.coverimage || frontmatter.image || fallbackCover;
  sources.add(source);
  if (frontmatter.coverwatermark === 'false') unwatermarkedSources.add(source);
}

let previousMap = {};
try {
  previousMap = JSON.parse(await readFile(mapPath, 'utf8'));
} catch {
  previousMap = {};
}

await mkdir(outputDir, { recursive: true });
const logoSvg = await readFile(logoPath);
const watermarkMap = {};
for (const source of [...sources].sort()) {
  if (unwatermarkedSources.has(source)) {
    if (!source.startsWith('/') || source.startsWith('//')) {
      throw new Error(`An unwatermarked blog cover must be a local public asset: ${source}`);
    }
    const localPath = path.resolve(publicDir, source.slice(1));
    if (!localPath.startsWith(`${publicDir}${path.sep}`) || !await fileExists(localPath)) {
      throw new Error(`Unwatermarked blog cover is missing from public assets: ${source}`);
    }
    watermarkMap[source] = source;
    console.log(`Kept approved blog cover without a watermark: ${source}`);
    continue;
  }

  const previousPath = previousMap[source];
  if (!forceRefresh && typeof previousPath === 'string') {
    const existingFile = path.resolve(publicDir, `.${previousPath}`);
    if (existingFile.startsWith(`${publicDir}${path.sep}`) && await fileExists(existingFile)) {
      watermarkMap[source] = previousPath;
      continue;
    }
  }
  watermarkMap[source] = await createWatermarkedImage(source, logoSvg);
  console.log(`Watermarked blog cover: ${source}`);
}

await writeFile(mapPath, `${JSON.stringify(watermarkMap, null, 2)}\n`, 'utf8');
console.log(`Generated permanent watermarked covers for ${sources.size} unique blog images.`);
