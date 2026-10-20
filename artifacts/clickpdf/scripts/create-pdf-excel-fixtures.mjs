import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const run = promisify(execFile);
const directory = '/tmp/clickpdf-excel-fixtures';
await mkdir(directory, { recursive: true });
const save = async (name, pdf) => writeFile(`${directory}/${name}`, await pdf.save());
const text = async () => {
  const pdf = await PDFDocument.create();
  return { pdf, normal: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
};
function drawGrid(page, heading, rows, font, bold, top = 690, width = 120) {
  const left = 30, fontSize = 12, rowHeight = 30;
  page.drawText(heading, { x: left, y: top + 47, size: 18, font: bold, color: rgb(.12, .25, .5) });
  rows.forEach((row, i) => row.forEach((cell, j) => {
    const x = left + j * width, y = top - i * rowHeight;
    page.drawRectangle({ x, y, width, height: rowHeight, borderWidth: 1, borderColor: rgb(.45, .5, .6) });
    if (cell) page.drawText(cell, { x: x + 6, y: y + 9, font: i ? font : bold, size: fontSize, color: rgb(.1, .16, .24) });
  }));
}
const { pdf: continued, normal, bold } = await text();
const header = ['Item', 'Category', 'Amount', 'Date', 'Percent'];
drawGrid(continued.addPage([612, 792]), 'Sales Report', [
  header, ['Chair', 'Furniture', '$1,234.50', '2026-10-20', '12.5%'],
  ['Desk', '', '($20.00)', '31/12/2026', '5%']
], normal, bold);
drawGrid(continued.addPage([612, 792]), 'Sales Report', [
  header, ['Lamp', 'Lighting', '1.234,50', '03/04/2026', '25%'],
  ['Shelf', 'Furniture', '000123', '', '2.5%']
], normal, bold);
await save('financial-continued.pdf', continued);

const { pdf: distinct, normal: small, bold: headingFont } = await text();
const page = distinct.addPage([612, 792]);
drawGrid(page, 'Products', [['Product', 'Price'], ['Pen', '$1.50'], ['Book', '$25.00']], small, headingFont, 660, 210);
drawGrid(page, 'Services', [['Service', 'Fee'], ['Packing', '15%'], ['Delivery', '($4.75)']], small, headingFont, 410, 210);
await save('separate-tables.pdf', distinct);

const { pdf: prose, normal: proseFont, bold: proseHeading } = await text();
const prosePage = prose.addPage([612, 792]);
prosePage.drawText('Project Introduction', { x: 50, y: 700, size: 18, font: proseHeading });
prosePage.drawText('This document contains paragraphs, not a structured table.', { x: 50, y: 660, size: 12, font: proseFont });
prosePage.drawText('Another line of unstructured words for the text mode.', { x: 50, y: 637, size: 12, font: proseFont });
await save('no-tables.pdf', prose);

const png = `${directory}/scanned-table.png`;
await run('convert', [
  '-size', '1600x2100', 'xc:white', '-font', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '-fill', '#1e293b', '-pointsize', '60',
  '-draw', "text 90,225 'INVOICE TABLE'",
  '-pointsize', '47',
  '-draw', "text 90,370 'ITEM'",
  '-draw', "text 700,370 'PRICE'",
  '-draw', "text 1280,370 'QTY'",
  '-draw', "text 90,485 'CHAIR'",
  '-draw', "text 700,485 '$12.50'",
  '-draw', "text 1280,485 '2'",
  '-draw', "text 90,600 'DESK'",
  '-draw', "text 700,600 '$100.00'",
  '-draw', "text 1280,600 '1'",
  '-draw', "text 90,715 'LAMP'",
  '-draw', "text 700,715 '$40.00'",
  '-draw', "text 1280,715 '3'",
  png
]);
const scan = await PDFDocument.create();
const scannedPage = scan.addPage([612, 792]);
const image = await scan.embedPng(await readFile(png));
scannedPage.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
await save('scanned-table.pdf', scan);
await writeFile(`${directory}/corrupted.pdf`, Buffer.from('Not a PDF — this must report a file-specific error.'));
console.log(`Prepared 5 PDF-to-Excel fixtures in ${directory}`);
