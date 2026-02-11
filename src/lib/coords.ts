import type { Point01, Rect01 } from './schema';

export const rect01ToPx = (rect: Rect01, width: number, height: number) => ({
  left: rect.x * width,
  top: rect.y * height,
  width: rect.w * width,
  height: rect.h * height
});

export const rectPxTo01 = (rect: { left: number; top: number; width: number; height: number }, width: number, height: number): Rect01 => ({
  x: rect.left / width,
  y: rect.top / height,
  w: rect.width / width,
  h: rect.height / height
});

export const rect01ToPdf = (rect: Rect01, pageWidth: number, pageHeight: number) => ({
  x: rect.x * pageWidth,
  y: pageHeight - (rect.y + rect.h) * pageHeight,
  width: rect.w * pageWidth,
  height: rect.h * pageHeight
});

export const point01ToPdf = (point: Point01, pageWidth: number, pageHeight: number) => ({
  x: point.x * pageWidth,
  y: pageHeight - point.y * pageHeight
});
