import type { UUID } from '../types/types';
import { generateId } from '../types/types';

export interface TreeNode {
  personId: UUID;
  generation: number;
  parentIds: UUID[];
  childrenIds: UUID[];
  partnerIds: UUID[];
  siblingIds: UUID[];
}

export interface FamilyTree {
  id: UUID;
  name: string;
  rootPersonId: UUID;
  nodes: Map<string, TreeNode>;
}

export function createFamilyTree(
  name: string,
  rootPersonId: UUID,
  id: UUID = generateId()
): FamilyTree {
  const nodes = new Map<string, TreeNode>();
  nodes.set(rootPersonId, {
    personId: rootPersonId,
    generation: 0,
    parentIds: [],
    childrenIds: [],
    partnerIds: [],
    siblingIds: [],
  });

  return { id, name, rootPersonId, nodes };
}

export function addTreeNode(
  tree: FamilyTree,
  personId: UUID,
  generation: number,
  parentIds: UUID[] = []
): void {
  tree.nodes.set(personId, {
    personId,
    generation,
    parentIds,
    childrenIds: [],
    partnerIds: [],
    siblingIds: [],
  });

  parentIds.forEach((parentId) => {
    const parent = tree.nodes.get(parentId);
    if (parent && !parent.childrenIds.includes(personId)) {
      parent.childrenIds.push(personId);
    }
  });
}

export function addPartnerLink(
  tree: FamilyTree,
  personId1: UUID,
  personId2: UUID
): void {
  const node1 = tree.nodes.get(personId1);
  const node2 = tree.nodes.get(personId2);

  if (node1 && !node1.partnerIds.includes(personId2)) {
    node1.partnerIds.push(personId2);
  }
  if (node2 && !node2.partnerIds.includes(personId1)) {
    node2.partnerIds.push(personId1);
  }
}

export function addSiblingLink(
  tree: FamilyTree,
  personId1: UUID,
  personId2: UUID
): void {
  const node1 = tree.nodes.get(personId1);
  const node2 = tree.nodes.get(personId2);

  if (node1 && !node1.siblingIds.includes(personId2)) {
    node1.siblingIds.push(personId2);
  }
  if (node2 && !node2.siblingIds.includes(personId1)) {
    node2.siblingIds.push(personId1);
  }
}

export function removeTreeNode(tree: FamilyTree, personId: UUID): void {
  const node = tree.nodes.get(personId);
  if (!node) return;

  node.parentIds.forEach((id) => {
    const parent = tree.nodes.get(id);
    if (parent) {
      parent.childrenIds = parent.childrenIds.filter((c) => c !== personId);
    }
  });

  node.childrenIds.forEach((id) => {
    const child = tree.nodes.get(id);
    if (child) {
      child.parentIds = child.parentIds.filter((p) => p !== personId);
    }
  });

  node.partnerIds.forEach((id) => {
    const partner = tree.nodes.get(id);
    if (partner) {
      partner.partnerIds = partner.partnerIds.filter((p) => p !== personId);
    }
  });

  node.siblingIds.forEach((id) => {
    const sibling = tree.nodes.get(id);
    if (sibling) {
      sibling.siblingIds = sibling.siblingIds.filter((s) => s !== personId);
    }
  });

  tree.nodes.delete(personId);
}
