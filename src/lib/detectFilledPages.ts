import type { FieldDef, FieldValues } from './schema';

export const detectFilledPages = (fields: FieldDef[], values: FieldValues): number[] => {
  const set = new Set<number>();
  fields.forEach((field) => {
    const value = values[field.id];
    const filled =
      (field.type === 'slider' && value !== null && value !== undefined) ||
      (field.type === 'checkbox' && value === true) ||
      (field.type === 'text' && typeof value === 'string' && value.trim().length > 0);
    if (filled) set.add(field.page);
  });
  return [...set].sort((a, b) => a - b);
};
