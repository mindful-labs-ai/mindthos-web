import type { UUID } from '../types/types';
import { generateId } from '../types/types';

import type { Subject } from './person';
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
  detail: boolean;
  clinicStatus: boolean;
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
  version: string;
}

// Genogram
export interface Genogram {
  id: UUID;
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
      detail: true,
      clinicStatus: true,
      relationLine: true,
      groupLine: true,
      grid: false,
      memo: true,
    },
  };
}

export function createGenogram(
  title: string,
  id: UUID = generateId()
): Genogram {
  const now = new Date();
  return {
    id,
    metadata: {
      title,
      createdAt: now,
      updatedAt: now,
      version: 'v1',
    },
    subjects: new Map(),
    connections: new Map(),
    annotations: new Map(),
    view: createDefaultView(),
  };
}

export function addSubject(genogram: Genogram, subject: Subject): void {
  genogram.subjects.set(subject.id, subject);
  genogram.metadata.updatedAt = new Date();
}

export function removeSubject(genogram: Genogram, subjectId: UUID): void {
  genogram.subjects.delete(subjectId);
  genogram.metadata.updatedAt = new Date();
}

export function addConnection(
  genogram: Genogram,
  connection: Connection
): void {
  genogram.connections.set(connection.id, connection);
  genogram.metadata.updatedAt = new Date();
}

export function removeConnection(genogram: Genogram, connectionId: UUID): void {
  genogram.connections.delete(connectionId);
  genogram.metadata.updatedAt = new Date();
}

export function addAnnotation(
  genogram: Genogram,
  annotation: Annotation
): void {
  genogram.annotations.set(annotation.id, annotation);
  genogram.metadata.updatedAt = new Date();
}

export function removeAnnotation(genogram: Genogram, annotationId: UUID): void {
  genogram.annotations.delete(annotationId);
  genogram.metadata.updatedAt = new Date();
}

// Serialization
export interface SerializedGenogram {
  id: string;
  metadata: GenogramMetadata;
  subjects: [string, Subject][];
  connections: [string, Connection][];
  annotations: [string, Annotation][];
  view: GenogramView;
}

export function serializeGenogram(genogram: Genogram): SerializedGenogram {
  return {
    id: genogram.id,
    metadata: genogram.metadata,
    subjects: Array.from(genogram.subjects.entries()),
    connections: Array.from(genogram.connections.entries()),
    annotations: Array.from(genogram.annotations.entries()),
    view: genogram.view,
  };
}

export function deserializeGenogram(data: SerializedGenogram): Genogram {
  return {
    id: data.id,
    metadata: {
      ...data.metadata,
      createdAt: new Date(data.metadata.createdAt),
      updatedAt: new Date(data.metadata.updatedAt),
    },
    subjects: new Map(data.subjects),
    connections: new Map(data.connections),
    annotations: new Map(data.annotations),
    view: data.view,
  };
}
