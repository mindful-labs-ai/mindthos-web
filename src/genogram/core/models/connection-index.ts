import type { UUID } from '../types/types';

import type { Connection } from './relationship';

/**
 * Connection 역인덱스.
 * subjectId → 해당 Subject를 참조하는 connectionId Set
 * connectionId → 해당 Connection을 parentRef로 참조하는 connectionId Set (자녀선 캐스케이드 삭제용)
 *
 * O(1) 조회로 DeleteSubject 등에서 전체 순회를 제거.
 */
export class ConnectionIndex {
  /** subjectId → Set<connectionId> */
  private bySubject = new Map<UUID, Set<UUID>>();
  /** connectionId(파트너선) → Set<connectionId(자녀선)> — parentRef 역참조 */
  private byParentRef = new Map<UUID, Set<UUID>>();

  /** 인덱스 전체 재구성 (deserialize 후 등) */
  rebuild(connections: Map<string, Connection>): void {
    this.bySubject.clear();
    this.byParentRef.clear();
    connections.forEach((conn) => this.add(conn));
  }

  /** Connection 추가 시 인덱스 갱신 */
  add(conn: Connection): void {
    const refs = extractSubjectRefs(conn);
    for (const ref of refs) {
      let set = this.bySubject.get(ref);
      if (!set) {
        set = new Set();
        this.bySubject.set(ref, set);
      }
      set.add(conn.id);
    }

    const parentRef = extractParentRef(conn);
    if (parentRef) {
      let set = this.byParentRef.get(parentRef);
      if (!set) {
        set = new Set();
        this.byParentRef.set(parentRef, set);
      }
      set.add(conn.id);
    }
  }

  /** Connection 삭제 시 인덱스 갱신 */
  remove(conn: Connection): void {
    const refs = extractSubjectRefs(conn);
    for (const ref of refs) {
      const set = this.bySubject.get(ref);
      if (set) {
        set.delete(conn.id);
        if (set.size === 0) this.bySubject.delete(ref);
      }
    }

    const parentRef = extractParentRef(conn);
    if (parentRef) {
      const set = this.byParentRef.get(parentRef);
      if (set) {
        set.delete(conn.id);
        if (set.size === 0) this.byParentRef.delete(parentRef);
      }
    }
  }

  /** subjectId를 참조하는 모든 connectionId 조회 — O(1) */
  getBySubject(subjectId: UUID): ReadonlySet<UUID> {
    return this.bySubject.get(subjectId) ?? EMPTY_SET;
  }

  /** connectionId(파트너선 등)를 parentRef로 참조하는 자녀선 connectionId 조회 — O(1) */
  getByParentRef(connectionId: UUID): ReadonlySet<UUID> {
    return this.byParentRef.get(connectionId) ?? EMPTY_SET;
  }
}

const EMPTY_SET: ReadonlySet<UUID> = new Set();

// ─── 내부 유틸 ───

/** Connection에서 참조하는 모든 Subject ID를 추출 */
function extractSubjectRefs(conn: Connection): UUID[] {
  const attr = conn.entity.attribute;
  const refs: UUID[] = [];

  if ('subjects' in attr && Array.isArray(attr.subjects)) {
    refs.push(...attr.subjects);
  }
  if ('startRef' in attr) {
    refs.push(attr.startRef as UUID);
  }
  if ('endRef' in attr) {
    refs.push(attr.endRef as UUID);
  }
  if ('childRef' in attr) {
    const cr = attr.childRef;
    if (Array.isArray(cr)) {
      refs.push(...cr);
    } else {
      refs.push(cr as UUID);
    }
  }

  return refs;
}

/** Children_Parents_Line의 parentRef 추출 (파트너선 ID 참조) */
function extractParentRef(conn: Connection): UUID | null {
  const attr = conn.entity.attribute;
  if ('parentRef' in attr) {
    return attr.parentRef as UUID;
  }
  return null;
}
