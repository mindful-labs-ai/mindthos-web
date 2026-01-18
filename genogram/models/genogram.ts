import { UUID, generateId } from "../core/types.js";
import { FamilyTree } from "./family-tree.js";
import { Person } from "./person.js";
import { Relationship } from "./relationship.js";
import { TextAnnotation } from "./text-annotation.js";

export interface GenogramMetadata {
  title: string;
  clientId?: UUID;
  createdAt: Date;
  updatedAt: Date;
  authorId?: string;
  description?: string;
  version: number;
}

export interface Genogram {
  id: UUID;
  metadata: GenogramMetadata;
  persons: Map<string, Person>;
  relationships: Map<string, Relationship>;
  textAnnotations: Map<string, TextAnnotation>;
  familyTrees: Map<string, FamilyTree>;
}

export function createGenogram(
  title: string,
  id: UUID = generateId(),
): Genogram {
  const now = new Date();
  return {
    id,
    metadata: {
      title,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    persons: new Map(),
    relationships: new Map(),
    textAnnotations: new Map(),
    familyTrees: new Map(),
  };
}

export function addPerson(genogram: Genogram, person: Person): void {
  genogram.persons.set(person.id, person);
  genogram.metadata.updatedAt = new Date();
}

export function removePerson(genogram: Genogram, personId: UUID): void {
  genogram.persons.delete(personId);

  genogram.relationships.forEach((rel, id) => {
    if (rel.sourceId === personId || rel.targetId === personId) {
      genogram.relationships.delete(id);
    }
  });

  genogram.metadata.updatedAt = new Date();
}

export function addRelationship(
  genogram: Genogram,
  relationship: Relationship,
): void {
  genogram.relationships.set(relationship.id, relationship);
  genogram.metadata.updatedAt = new Date();
}

export function removeRelationship(
  genogram: Genogram,
  relationshipId: UUID,
): void {
  genogram.relationships.delete(relationshipId);
  genogram.metadata.updatedAt = new Date();
}

export function addTextAnnotation(
  genogram: Genogram,
  text: TextAnnotation,
): void {
  genogram.textAnnotations.set(text.id, text);
  genogram.metadata.updatedAt = new Date();
}

export function removeTextAnnotation(genogram: Genogram, textId: UUID): void {
  genogram.textAnnotations.delete(textId);
  genogram.metadata.updatedAt = new Date();
}

export function addFamilyTree(genogram: Genogram, tree: FamilyTree): void {
  genogram.familyTrees.set(tree.id, tree);
  genogram.metadata.updatedAt = new Date();
}

export function removeFamilyTree(genogram: Genogram, treeId: UUID): void {
  genogram.familyTrees.delete(treeId);
  genogram.metadata.updatedAt = new Date();
}

export function getRelationshipsByPerson(
  genogram: Genogram,
  personId: UUID,
): Relationship[] {
  const result: Relationship[] = [];
  genogram.relationships.forEach((rel) => {
    if (rel.sourceId === personId || rel.targetId === personId) {
      result.push(rel);
    }
  });
  return result;
}

// Serialization
export interface SerializedGenogram {
  id: string;
  metadata: GenogramMetadata;
  persons: [string, Person][];
  relationships: [string, Relationship][];
  textAnnotations: [string, TextAnnotation][];
  familyTrees: [
    string,
    { id: string; name: string; rootPersonId: string; nodes: [string, any][] },
  ][];
}

export function serializeGenogram(genogram: Genogram): SerializedGenogram {
  return {
    id: genogram.id,
    metadata: genogram.metadata,
    persons: Array.from(genogram.persons.entries()),
    relationships: Array.from(genogram.relationships.entries()),
    textAnnotations: Array.from(genogram.textAnnotations.entries()),
    familyTrees: Array.from(genogram.familyTrees.entries()).map(
      ([id, tree]) => [
        id,
        { ...tree, nodes: Array.from(tree.nodes.entries()) },
      ],
    ),
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
    persons: new Map(data.persons),
    relationships: new Map(data.relationships),
    textAnnotations: new Map(data.textAnnotations),
    familyTrees: new Map(
      data.familyTrees.map(([id, tree]) => [
        id,
        { ...tree, nodes: new Map(tree.nodes) },
      ]),
    ),
  };
}
