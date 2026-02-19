import { FetusStatus, SubjectType } from '../types/enums';
import type { UUID } from '../types/types';
import { generateId } from '../types/types';

import type { FetusAttribute, PersonAttribute, Subject } from './person';
import type { Connection } from './relationship';
import type { Annotation } from './text-annotation';

// View
export interface ViewPoint {
  center: { x: number; y: number };
  zoom: number;
}

export interface Visibility {
  name: boolean;
  age: boolean;
  birthDate: boolean;
  deathDate: boolean;
  extraInfo: boolean;
  illness: boolean;
  relationLine: boolean;
  groupLine: boolean;
  grid: boolean;
  memo: boolean;
}

export interface GenogramView {
  viewPoint: ViewPoint;
  visibility: Visibility;
}

// Genogram Metadata
export interface GenogramMetadata {
  title: string;
  clientId?: UUID;
  createdAt: Date;
  updatedAt: Date;
  authorId?: string;
  description?: string;
}

// Genogram
export interface Genogram {
  id: UUID;
  version: string;
  metadata: GenogramMetadata;
  subjects: Map<string, Subject>;
  connections: Map<string, Connection>;
  annotations: Map<string, Annotation>;
  view: GenogramView;
}

export function createDefaultView(): GenogramView {
  return {
    viewPoint: {
      center: { x: 0, y: 0 },
      zoom: 1.0,
    },
    visibility: {
      name: true,
      age: true,
      birthDate: true,
      deathDate: true,
      extraInfo: true,
      illness: true,
      relationLine: true,
      groupLine: true,
      grid: true,
      memo: true,
    },
  };
}

export function createGenogram(
  title: string,
  id: UUID = generateId('genogram')
): Genogram {
  const now = new Date();
  return {
    id,
    version: 'v1',
    metadata: {
      title,
      createdAt: now,
      updatedAt: now,
    },
    subjects: new Map(),
    connections: new Map(),
    annotations: new Map(),
    view: createDefaultView(),
  };
}

// Serialization
export interface SerializedGenogram {
  id: string;
  version: string;
  metadata: GenogramMetadata;
  subjects: Subject[];
  connections: Connection[];
  annotations: Annotation[];
  view: GenogramView;
}

export function serializeGenogram(genogram: Genogram): SerializedGenogram {
  return {
    id: genogram.id,
    version: genogram.version,
    metadata: genogram.metadata,
    subjects: Array.from(genogram.subjects.values()),
    connections: Array.from(genogram.connections.values()),
    annotations: Array.from(genogram.annotations.values()),
    view: genogram.view,
  };
}

/** 레거시 SubjectType → FetusStatus 매핑 */
const LEGACY_SUBJECT_TYPE_TO_FETUS_STATUS: Record<string, FetusStatus> = {
  MISCARRIAGE: FetusStatus.Miscarriage,
  ABORTION: FetusStatus.Abortion,
  PREGNANCY: FetusStatus.Pregnancy,
};

/** 레거시 SubjectType(MISCARRIAGE/ABORTION/PREGNANCY)을 Fetus + FetusStatus로 마이그레이션 */
function migrateSubject(subject: Subject): Subject {
  let result = subject;

  // Fetus 마이그레이션
  const fetusStatus =
    LEGACY_SUBJECT_TYPE_TO_FETUS_STATUS[result.entity.type as string];
  if (fetusStatus) {
    result = {
      ...result,
      entity: {
        ...result.entity,
        type: SubjectType.Fetus,
        attribute: { name: null, status: fetusStatus } satisfies FetusAttribute,
      },
    };
  }

  // isIP 필드 마이그레이션 (레거시 데이터에 없을 수 있음)
  if (
    result.entity.type === SubjectType.Person &&
    !('isIP' in result.entity.attribute)
  ) {
    result = {
      ...result,
      entity: {
        ...result.entity,
        attribute: { ...result.entity.attribute, isIP: false },
      },
    };
  }

  // extraInfo.shortNote 필드 마이그레이션 (레거시 데이터에 없을 수 있음)
  if (result.entity.type === SubjectType.Person) {
    const personAttr = result.entity.attribute as PersonAttribute;
    const extraInfo = personAttr.extraInfo as unknown as Record<
      string,
      unknown
    >;
    if (extraInfo && extraInfo.shortNote === undefined) {
      result = {
        ...result,
        entity: {
          ...result.entity,
          attribute: {
            ...personAttr,
            extraInfo: {
              enable: Boolean(extraInfo.enable),
              job: (extraInfo.job as string) ?? null,
              education: (extraInfo.education as string) ?? null,
              region: (extraInfo.region as string) ?? null,
              shortNote: null,
            },
          },
        },
      };
    }
  }

  return result;
}

export function deserializeGenogram(data: SerializedGenogram): Genogram {
  return {
    id: data.id,
    version: data.version,
    metadata: {
      ...data.metadata,
      createdAt: new Date(data.metadata.createdAt),
      updatedAt: new Date(data.metadata.updatedAt),
    },
    subjects: new Map(
      data.subjects.map((s) => {
        const migrated = migrateSubject(s);
        return [migrated.id, migrated];
      })
    ),
    connections: new Map(data.connections.map((c) => [c.id, c])),
    annotations: new Map(data.annotations.map((a) => [a.id, a])),
    view: data.view,
  };
}
