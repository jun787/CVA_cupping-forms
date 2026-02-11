import type { FieldValues } from '../lib/schema';

export type Session = {
  id: string;
  title: string;
  sampleName: string;
  createdAt: string;
  updatedAt: string;
  values: FieldValues;
};
