import { ClinicStatus, NodeSize, SubjectType } from '../types/enums';
import type { Gender } from '../types/enums';
import type { Point, UUID } from '../types/types';
import { generateId } from '../types/types';

// Person Attribute
export interface PersonLifeSpan {
  birth: string | null;
  death: string | null;
}

export interface PersonDetail {
  enable: boolean;
  job: string | null;
  education: string | null;
  region: string | null;
}

export interface PersonAttribute {
  gender: Gender;
  name: string | null;
  isDead: boolean;
  lifeSpan: PersonLifeSpan;
  age: number | null;
  clinicStatus: ClinicStatus;
  detail: PersonDetail;
}

// Animal Attribute
export interface AnimalAttribute {
  name: string | null;
  isDead: boolean;
}

// Subject Entity
export interface SubjectEntity {
  type: SubjectType;
  attribute: PersonAttribute | AnimalAttribute;
  memo: string | null;
}

// Subject Style
export interface SubjectStyle {
  size: (typeof NodeSize)[keyof typeof NodeSize];
  bgColor: string;
  textColor: string;
}

// Subject Layout (style은 layout 하위)
export interface SubjectLayout {
  center: Point;
  style: SubjectStyle;
}

// Subject
export interface Subject {
  id: UUID;
  entity: SubjectEntity;
  layout: SubjectLayout;
}

export function createPersonSubject(
  gender: Gender,
  position: Point,
  id: UUID = generateId()
): Subject {
  return {
    id,
    entity: {
      type: SubjectType.Person,
      attribute: {
        gender,
        name: null,
        isDead: false,
        lifeSpan: { birth: null, death: null },
        age: null,
        clinicStatus: ClinicStatus.없음,
        detail: {
          enable: false,
          job: null,
          education: null,
          region: null,
        },
      } satisfies PersonAttribute,
      memo: null,
    },
    layout: {
      center: position,
      style: {
        size: NodeSize.Default,
        bgColor: '#FFFFFF',
        textColor: '#000000',
      },
    },
  };
}

export function createAnimalSubject(
  position: Point,
  id: UUID = generateId()
): Subject {
  return {
    id,
    entity: {
      type: SubjectType.Animal,
      attribute: {
        name: null,
        isDead: false,
      } satisfies AnimalAttribute,
      memo: null,
    },
    layout: {
      center: position,
      style: {
        size: NodeSize.Default,
        bgColor: '#FFFFFF',
        textColor: '#000000',
      },
    },
  };
}

export type SubjectUpdate = Partial<Omit<Subject, 'id'>>;
