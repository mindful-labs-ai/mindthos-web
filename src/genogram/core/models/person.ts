import {
  ClinicalStatus,
  Gender,
  MigrationStatus,
  SexualOrientation,
} from '../types/enums';
import type { UUID } from '../types/types';
import { generateId } from '../types/types';

export interface Person {
  id: UUID;
  name: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  isPregnancy: boolean;
  isDeceased: boolean;
  birthDate?: string;
  deathDate?: string;
  age?: number;
  causeOfDeath?: string;
  clinicalStatus: ClinicalStatus[];
  clinicalDescription?: string;
  migrationStatus: MigrationStatus;
  occupation?: string;
  education?: string;
  residence?: string;
  hasSecret: boolean;
  secretContent?: string;
  memo?: string;
}

export function createPerson(
  name: string,
  gender: Gender,
  id: UUID = generateId()
): Person {
  return {
    id,
    name,
    gender,
    sexualOrientation: SexualOrientation.Heterosexual,
    isPregnancy: false,
    isDeceased: false,
    clinicalStatus: [],
    migrationStatus: MigrationStatus.None,
    hasSecret: false,
  };
}

export type PersonUpdate = Partial<Omit<Person, 'id'>>;
