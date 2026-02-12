import { DEFAULT_BG, DEFAULT_FG } from '../constants/colors';
import {
  Gender as GenderEnum,
  Illness,
  NodeSize,
  SubjectType,
} from '../types/enums';
import type { Gender, FetusStatus } from '../types/enums';
import type { Point, UUID } from '../types/types';
import { generateId } from '../types/types';

// Person Attribute
export interface PersonLifeSpan {
  birth: string | null;
  death: string | null;
}

export interface PersonExtraInfo {
  enable: boolean;
  job: string | null;
  education: string | null;
  region: string | null;
  shortNote: string | null;
}

export interface PersonAttribute {
  gender: Gender;
  name: string | null;
  isIP: boolean;
  isDead: boolean;
  lifeSpan: PersonLifeSpan;
  age: number | null;
  illness: Illness;
  extraInfo: PersonExtraInfo;
}

// Animal Attribute
export interface AnimalAttribute {
  name: string | null;
  isDead: boolean;
}

// Fetus Attribute (유산/낙태/임신 중)
export interface FetusAttribute {
  name: null;
  status: FetusStatus;
}

// Subject Entity
export interface SubjectEntity {
  type: SubjectType;
  attribute: PersonAttribute | AnimalAttribute | FetusAttribute;
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
  id: UUID = generateId('person')
): Subject {
  return {
    id,
    entity: {
      type: SubjectType.Person,
      attribute: {
        gender,
        name: null,
        isIP: false,
        isDead: false,
        lifeSpan: { birth: null, death: null },
        age: null,
        illness: Illness.None,
        extraInfo: {
          enable: false,
          job: null,
          education: null,
          region: null,
          shortNote: null,
        },
      } satisfies PersonAttribute,
      memo: null,
    },
    layout: {
      center: position,
      style: {
        size: NodeSize.Default,
        bgColor: DEFAULT_BG,
        textColor: DEFAULT_FG,
      },
    },
  };
}

export function createAnimalSubject(
  position: Point,
  id: UUID = generateId('animal')
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
        bgColor: DEFAULT_BG,
        textColor: DEFAULT_FG,
      },
    },
  };
}

export function createFetusSubject(
  status: FetusStatus,
  position: Point,
  id: UUID = generateId('fetus')
): Subject {
  return {
    id,
    entity: {
      type: SubjectType.Fetus,
      attribute: { name: null, status } satisfies FetusAttribute,
      memo: null,
    },
    layout: {
      center: position,
      style: {
        size: NodeSize.Small,
        bgColor: DEFAULT_BG,
        textColor: DEFAULT_FG,
      },
    },
  };
}

export type SubjectUpdate = Partial<Omit<Subject, 'id'>>;

/** 노드 도형 타입 */
export type NodeShape = 'circle' | 'rect' | 'diamond';

/**
 * Subject의 gender/type에서 노드 도형을 판별합니다.
 */
export function getNodeShape(subject: Subject | undefined): NodeShape {
  if (!subject) return 'circle';
  if (subject.entity.type === SubjectType.Animal) return 'diamond';
  if (subject.entity.type === SubjectType.Fetus) return 'circle';
  const attr = subject.entity.attribute as PersonAttribute;
  switch (attr.gender) {
    case GenderEnum.Male:
    case GenderEnum.Gay:
    case GenderEnum.Transgender_Male:
    case GenderEnum.Nonbinary:
      return 'rect';
    default:
      return 'circle';
  }
}

/**
 * Gender 값에서 노드 도형을 판별합니다 (Ghost 미리보기 등에서 사용).
 */
export function getGenderShape(gender: Gender | undefined): NodeShape {
  switch (gender) {
    case GenderEnum.Female:
    case GenderEnum.Lesbian:
    case GenderEnum.Transgender_Female:
      return 'circle';
    case GenderEnum.Nonbinary:
      return 'rect';
    case GenderEnum.Male:
    case GenderEnum.Gay:
    case GenderEnum.Transgender_Male:
    default:
      return 'rect';
  }
}
