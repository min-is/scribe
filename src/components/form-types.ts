// Generic form component types

import { ReactNode } from 'react';

export type FieldSetType =
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'checkbox'
  | 'hidden';

export interface AnnotatedTag {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  annotation?: ReactNode;
  annotationAria?: string;
}
