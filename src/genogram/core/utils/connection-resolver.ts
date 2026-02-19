import type { Genogram } from '../models/genogram';
import type {
  Connection,
  ParentChildAttribute,
  PartnerAttribute,
} from '../models/relationship';
import { ConnectionType } from '../types/enums';

/**
 * Connection의 source/target Subject ID를 결정합니다.
 * - Partner/Relation: subjects[0], subjects[1]
 * - Influence: startRef, endRef
 * - ParentChild: parentRef(파트너선이면 첫 번째 Subject), childRef
 */
export function resolveConnectionEndpoints(
  conn: Connection,
  genogram: Genogram
): { source: string; target: string } {
  const attr = conn.entity.attribute;

  if ('subjects' in attr && Array.isArray(attr.subjects)) {
    return { source: attr.subjects[0], target: attr.subjects[1] };
  }

  if ('startRef' in attr && 'endRef' in attr) {
    return { source: attr.startRef, target: attr.endRef };
  }

  if ('parentRef' in attr && 'childRef' in attr) {
    const pcAttr = attr as ParentChildAttribute;
    let source: string;

    const partnerConn = genogram.connections.get(pcAttr.parentRef);
    if (partnerConn && 'subjects' in partnerConn.entity.attribute) {
      const pAttr = partnerConn.entity.attribute as PartnerAttribute;
      source = pAttr.subjects[0];
    } else {
      source = pcAttr.parentRef;
    }

    const target = Array.isArray(pcAttr.childRef)
      ? pcAttr.childRef[0]
      : pcAttr.childRef;

    return { source, target };
  }

  return { source: '', target: '' };
}

/**
 * ConnectionType별 source/target Handle 앵커를 결정합니다.
 */
export function resolveConnectionHandles(connType: ConnectionType): {
  sourceHandle: string;
  targetHandle: string;
} {
  switch (connType) {
    case ConnectionType.Partner_Line:
      return { sourceHandle: 'bottom-source', targetHandle: 'bottom-target' };
    case ConnectionType.Children_Parents_Line:
      return { sourceHandle: 'bottom-source', targetHandle: 'top-target' };
    default:
      return { sourceHandle: 'center-source', targetHandle: 'center-target' };
  }
}
