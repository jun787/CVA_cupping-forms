import type { PDFFont } from 'pdf-lib';

export const wrapTextWithEllipsis = (
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxLines: number
): string[] => {
  const chars = [...text.replace(/\r\n/g, '\n')];
  const lines: string[] = [];
  let current = '';

  const push = (line: string) => {
    if (lines.length < maxLines) lines.push(line);
  };

  for (const char of chars) {
    if (char === '\n') {
      push(current);
      current = '';
      continue;
    }
    const next = current + char;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else {
      push(current || char);
      current = current ? char : '';
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) push(current);

  const overflow = chars.join('') !== lines.join('\n');
  if (overflow && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (font.widthOfTextAtSize(`${last}…`, fontSize) > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
};
