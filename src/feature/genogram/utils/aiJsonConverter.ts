import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import {
  ConnectionType,
  FetusStatus,
  Gender,
  Illness,
  NodeSize,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
  StrokeWidth,
  SubjectType,
} from '@/genogram/core/types/enums';

// ─────────────────────────────────────── 상수 ──────────────────────────────────────

const GRID_SIZE = 30;
const DEFAULT_BG = '#FFFFFF';
const DEFAULT_FG = '#3C3C3C';

// ─────────────────────────────────────────────────────────────────────────────
// AI 출력 타입 (summary.ts의 GENOGRAM_JSON_PROMPT 출력 형식)
// ─────────────────────────────────────────────────────────────────────────────

export type AICoupleStatus =
  | 'marriage'
  | 'divorced'
  | 'separated'
  | 'cohabiting'
  | 'engaged';

export type AIChildStatus = 'biological' | 'adopted' | 'foster';

/**
 * AI가 출력하는 가계도 JSON 형식
 */
export interface AIGenogramOutput {
  subjects: AISubject[];
  couples: [number, number, AICoupleStatus?][]; // [husbandId, wifeId, status?]
  children: [number | null, number | null, number, AIChildStatus?][]; // [fatherId, motherId, childId, status?]
  fetus: AIFetusEntry[]; // [fatherId, motherId, status, x?, y?]
  relations: [number, number, string][]; // [id1, id2, description]
}

/**
 * Fetus 엔트리 타입
 */
export type AIFetusEntry =
  | [number | null, number | null, string] // 기본: [fatherId, motherId, status]
  | [number | null, number | null, string, number, number]; // 보정 후: [fatherId, motherId, status, x, y]

/**
 * AI가 출력하는 개인 정보
 */
export interface AISubject {
  id: number;
  type: 'PERSON' | 'FETUS';
  gender?:
    | 'Male'
    | 'Female'
    | 'Gay'
    | 'Lesbian'
    | 'Transgender_Male'
    | 'Transgender_Female'
    | 'Nonbinary';
  name?: string;
  isIP?: boolean;
  isDead?: boolean;
  illness?:
    | 'None'
    | 'Psychological_Or_Physical_Problem'
    | 'Alcohol_Or_Drug_Abuse'
    | 'Suspected_Alcohol_Or_Drug_Abuse'
    | 'Psychological_Or_Physical_Illness_In_Remission'
    | 'In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems'
    | 'In_Recovery_From_Substance_Abuse'
    | 'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse'
    | 'In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems';
  memo?: string;
  x: number; // AI가 계산한 X 좌표
  y: number; // AI가 계산한 Y 좌표
  size?: 'DEFAULT' | 'SMALL';
  birthOrder?: number; // 형제 중 출생 순서 (1=첫째)
  birthYear?: number | string | null; // 출생연도 (YYYY)
  deathYear?: number | string | null; // 사망연도 (YYYY)
  age?: number | null; // 나이
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────────────────────────────────────

function snapToGrid(value: number): number {
  const n = Math.round((value - 15) / GRID_SIZE);
  return n * GRID_SIZE + 15;
}

function generateId(prefix: string): string {
  const timestamp = Date.now();
  const uuid = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${uuid}`;
}

/**
 * YYYY 형식의 연도를 YYYYMMDD 형식으로 변환
 * 정확한 월/일이 없으면 1월 1일로 보정
 */
function normalizeYearToDate(
  year: number | string | null | undefined
): string | null {
  if (year === null || year === undefined) return null;

  const yearStr = String(year).trim();
  if (!yearStr) return null;

  // 이미 YYYYMMDD 형식인 경우 그대로 반환
  if (/^\d{8}$/.test(yearStr)) {
    return yearStr;
  }

  // YYYY 형식인 경우 0101 추가
  if (/^\d{4}$/.test(yearStr)) {
    return `${yearStr}0101`;
  }

  // 숫자로 변환 가능한 경우
  const numYear = Number(yearStr);
  if (!isNaN(numYear) && numYear >= 1000 && numYear <= 9999) {
    return `${numYear}0101`;
  }

  return null;
}

/**
 * AI gender 문자열을 Gender enum으로 변환
 */
function mapGender(
  aiGender?: AISubject['gender']
): (typeof Gender)[keyof typeof Gender] {
  switch (aiGender) {
    case 'Male':
      return Gender.Male;
    case 'Female':
      return Gender.Female;
    case 'Gay':
      return Gender.Gay;
    case 'Lesbian':
      return Gender.Lesbian;
    case 'Transgender_Male':
      return Gender.Transgender_Male;
    case 'Transgender_Female':
      return Gender.Transgender_Female;
    case 'Nonbinary':
      return Gender.Nonbinary;
    default:
      return Gender.Male;
  }
}

/**
 * AI illness 문자열을 Illness enum으로 변환
 */
function mapIllness(
  aiIllness?: AISubject['illness']
): (typeof Illness)[keyof typeof Illness] {
  switch (aiIllness) {
    case 'Psychological_Or_Physical_Problem':
      return Illness.Psychological_Or_Physical_Problem;
    case 'Alcohol_Or_Drug_Abuse':
      return Illness.Alcohol_Or_Drug_Abuse;
    case 'Suspected_Alcohol_Or_Drug_Abuse':
      return Illness.Suspected_Alcohol_Or_Drug_Abuse;
    case 'Psychological_Or_Physical_Illness_In_Remission':
      return Illness.Psychological_Or_Physical_Illness_In_Remission;
    case 'In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems':
      return Illness.In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems;
    case 'In_Recovery_From_Substance_Abuse':
      return Illness.In_Recovery_From_Substance_Abuse;
    case 'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse':
      return Illness.Serious_Mental_Or_Physical_Problems_And_Substance_Abuse;
    case 'In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems':
      return Illness.In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems;
    default:
      return Illness.None;
  }
}

/**
 * AI couple status를 PartnerStatus enum으로 변환
 */
function mapPartnerStatus(
  status?: AICoupleStatus
): (typeof PartnerStatus)[keyof typeof PartnerStatus] {
  switch (status) {
    case 'divorced':
      return PartnerStatus.Divorce;
    case 'separated':
      return PartnerStatus.Marital_Separation;
    case 'cohabiting':
      return PartnerStatus.Couple_Relationship;
    case 'engaged':
      return PartnerStatus.Couple_Relationship;
    default:
      return PartnerStatus.Marriage;
  }
}

/**
 * AI child status를 ParentChildStatus enum으로 변환
 */
function mapChildStatus(
  status?: AIChildStatus
): (typeof ParentChildStatus)[keyof typeof ParentChildStatus] {
  switch (status) {
    case 'adopted':
      return ParentChildStatus.Adopted_Child;
    case 'foster':
      return ParentChildStatus.Foster_Child;
    default:
      return ParentChildStatus.Biological_Child;
  }
}

/**
 * Fetus status 문자열을 FetusStatus enum으로 변환
 */
function mapFetusStatus(
  status: string
): (typeof FetusStatus)[keyof typeof FetusStatus] {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy')) {
    return FetusStatus.Pregnancy;
  }
  if (lower.includes('낙태') || lower.includes('abortion')) {
    return FetusStatus.Abortion;
  }
  return FetusStatus.Miscarriage;
}

/**
 * Fetus status를 ParentChildStatus로 변환
 */
function mapFetusToChildStatus(
  status: string
): (typeof ParentChildStatus)[keyof typeof ParentChildStatus] {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy')) {
    return ParentChildStatus.Pregnancy;
  }
  if (lower.includes('낙태') || lower.includes('abortion')) {
    return ParentChildStatus.Abortion;
  }
  return ParentChildStatus.Miscarriage;
}

/**
 * 관계 설명을 RelationStatus로 변환
 */
function mapRelationStatus(
  description: string
): (typeof RelationStatus)[keyof typeof RelationStatus] {
  const lower = description.toLowerCase();
  if (
    lower.includes('친밀') ||
    lower.includes('가까') ||
    lower.includes('close')
  ) {
    return RelationStatus.Close;
  }
  if (lower.includes('융합') || lower.includes('fused')) {
    return RelationStatus.Fused;
  }
  if (
    lower.includes('소원') ||
    lower.includes('distant') ||
    lower.includes('거리')
  ) {
    return RelationStatus.Distant;
  }
  if (
    lower.includes('적대') ||
    lower.includes('갈등') ||
    lower.includes('hostile')
  ) {
    return RelationStatus.Hostile;
  }
  if (lower.includes('단절') || lower.includes('cutoff')) {
    return RelationStatus.Cutoff;
  }
  return RelationStatus.Connected;
}

// ─────────────────────────────────────────────────────────────────────────────
// 좌표 후처리 보정
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Y좌표 세대 판별 (수정 예정)
 * - 조부모: -315 ~ -255
 * - 부모: -165 ~ -105
 * - 본인(IP): -15 ~ 45
 * - 자녀: 135 ~ 195
 * - 손자녀: 285 ~ 345
 */
type Generation = 'grandparent' | 'parent' | 'self' | 'child' | 'grandchild';

function getGeneration(y: number): Generation {
  if (y >= -345 && y <= -225) return 'grandparent';
  if (y >= -195 && y <= -75) return 'parent';
  if (y >= -45 && y <= 75) return 'self';
  if (y >= 105 && y <= 225) return 'child';
  return 'grandchild';
}

/**
 * 세대에 해당하는 Y좌표 중앙값 반환
 */
function getGenerationCenterY(gen: Generation): number {
  switch (gen) {
    case 'grandparent':
      return -285;
    case 'parent':
      return -135;
    case 'self':
      return 15;
    case 'child':
      return 165;
    case 'grandchild':
      return 315;
  }
}

/**
 * 부부-자녀 관계 정보
 */
interface CoupleChildrenInfo {
  husbandId: number;
  wifeId: number;
  childrenIds: number[];
  fetusIndices: number[];
}

/**
 * AI 출력 좌표 후처리 보정
 *
 * 보정 규칙:
 * 1. 부부가 모든 자녀(Person + Fetus)를 x축으로 감싸도록 보정
 * 2. Fetus y좌표가 부모 세대 + 1 세대가 되도록 보정
 * 3. 남편 x < 아내 x 보장
 * 4. 같은 세대(y좌표)에서 x좌표 중복 방지
 * 5. 같은 세대 부부 범위(minX~maxX) 겹침 시 가족 트리 통째 이동
 */
function postProcessCoordinates(aiOutput: AIGenogramOutput): AIGenogramOutput {
  // Deep copy
  const output: AIGenogramOutput = JSON.parse(JSON.stringify(aiOutput));

  // 1. 부부-자녀 관계 맵 구축
  const coupleMap = new Map<string, CoupleChildrenInfo>();

  for (const [husbandId, wifeId] of output.couples || []) {
    const key = `${husbandId}-${wifeId}`;
    coupleMap.set(key, {
      husbandId,
      wifeId,
      childrenIds: [],
      fetusIndices: [],
    });
  }

  // children 배열에서 자녀 정보 수집
  for (const [fatherId, motherId, childId] of output.children || []) {
    const key = `${fatherId}-${motherId}`;
    const couple = coupleMap.get(key);
    if (couple) {
      couple.childrenIds.push(childId);
    }
  }

  // fetus 배열에서 자녀 정보 수집
  let fetusIdx = 0;
  for (const [fatherId, motherId] of output.fetus || []) {
    const key = `${fatherId}-${motherId}`;
    const couple = coupleMap.get(key);
    if (couple) {
      couple.fetusIndices.push(fetusIdx);
    }
    fetusIdx++;
  }

  // 2. ID로 subject 빠르게 찾기 위한 맵
  const subjectById = new Map<number, AISubject>();
  for (const s of output.subjects || []) {
    subjectById.set(s.id, s);
  }

  // 3. 각 부부에 대해 좌표 보정 수행
  for (const [, couple] of coupleMap) {
    const husband = subjectById.get(couple.husbandId);
    const wife = subjectById.get(couple.wifeId);

    if (!husband || !wife) continue;

    // 부부 세대 결정 (부모 y 좌표 기준)
    const parentGen = getGeneration(husband.y);

    // 자녀 세대 결정 (부모 + 1세대)
    const childGen: Generation =
      parentGen === 'grandparent'
        ? 'parent'
        : parentGen === 'parent'
          ? 'self'
          : parentGen === 'self'
            ? 'child'
            : 'grandchild';

    // 모든 자녀(Person + Fetus)의 x 좌표 수집
    const childXCoords: number[] = [];

    for (const childId of couple.childrenIds) {
      const child = subjectById.get(childId);
      if (child) {
        childXCoords.push(child.x);
      }
    }

    // Fetus y 좌표 보정 및 x 좌표 수집
    for (const fIdx of couple.fetusIndices) {
      const fetus = output.fetus?.[fIdx];
      if (fetus) {
        const [fatherId, motherId, status] = fetus;

        // Fetus x 좌표 계산: 부모 중심 + 오프셋 (기존 자녀 오른쪽)
        const fatherSubject = subjectById.get(fatherId ?? -1);
        const motherSubject = subjectById.get(motherId ?? -1);

        let fetusX = 15;
        if (fatherSubject && motherSubject) {
          // 기존 자녀가 있으면 그 오른쪽, 없으면 부모 중심
          const existingChildX =
            childXCoords.length > 0 ? Math.max(...childXCoords) : null;
          if (existingChildX !== null) {
            fetusX = existingChildX + 90;
          } else {
            fetusX = (fatherSubject.x + motherSubject.x) / 2;
          }
        } else if (fatherSubject) {
          fetusX = fatherSubject.x + 90;
        } else if (motherSubject) {
          fetusX = motherSubject.x + 90;
        }

        // Fetus y 좌표: 부모 + 1 세대의 중앙값
        const fetusY = getGenerationCenterY(childGen);

        childXCoords.push(fetusX);

        // fetus에 보정된 좌표 저장 (5요소 튜플로 확장)
        output.fetus[fIdx] = [fatherId, motherId, status, fetusX, fetusY];
      }
    }

    // 자녀가 없으면 부부 보정 스킵
    if (childXCoords.length === 0) continue;

    const childMinX = Math.min(...childXCoords);
    const childMaxX = Math.max(...childXCoords);

    // 부부가 자녀를 감싸도록 x 좌표 보정
    const expectedHusbandX = childMinX - 45;
    const expectedWifeX = childMaxX + 45;

    // 남편이 왼쪽, 아내가 오른쪽 보장
    let husbandX = husband.x;
    let wifeX = wife.x;

    // 남편/아내 위치가 바뀌어 있으면 스왑
    if (husbandX > wifeX) {
      [husbandX, wifeX] = [wifeX, husbandX];
    }

    // 자녀를 감싸도록 보정
    if (husbandX > expectedHusbandX) {
      husbandX = expectedHusbandX;
    }

    if (wifeX < expectedWifeX) {
      wifeX = expectedWifeX;
    }

    husband.x = snapToGrid(husbandX);
    wife.x = snapToGrid(wifeX);
  }

  // 4. 같은 세대(y좌표)에서 x좌표 중복 방지
  // 부부 단위로 처리: 왼쪽 부부 먼저 고정, 겹치는 부부는 전체 이동
  const usedCoordsByGeneration = new Map<Generation, Set<number>>();

  // 4-1. 부부 정보 수집 및 x좌표 기준 정렬
  interface CoupleInfo {
    husbandId: number;
    wifeId: number;
    minX: number; // 부부 중 최소 x
  }
  const couples: CoupleInfo[] = [];
  for (const [husbandId, wifeId] of output.couples || []) {
    const husband = subjectById.get(husbandId);
    const wife = subjectById.get(wifeId);
    if (husband && wife) {
      couples.push({
        husbandId,
        wifeId,
        minX: Math.min(husband.x, wife.x),
      });
    }
  }
  // 왼쪽 부부부터 처리 (minX 오름차순)
  couples.sort((a, b) => a.minX - b.minX);

  // 4-2. 부부 단위로 중복 체크 및 이동
  const processedIds = new Set<number>();
  for (const couple of couples) {
    const husband = subjectById.get(couple.husbandId);
    const wife = subjectById.get(couple.wifeId);
    if (!husband || !wife) continue;

    const gen = getGeneration(husband.y);
    if (!usedCoordsByGeneration.has(gen)) {
      usedCoordsByGeneration.set(gen, new Set());
    }
    const usedX = usedCoordsByGeneration.get(gen)!;

    const husbandX = snapToGrid(husband.x);
    const wifeX = snapToGrid(wife.x);

    // 부부 중 하나라도 겹치면 부부 전체를 이동
    const hasConflict = usedX.has(husbandX) || usedX.has(wifeX);
    if (hasConflict) {
      // 부부 전체를 오른쪽으로 이동할 offset 계산
      let offset = 0;
      while (usedX.has(husbandX + offset) || usedX.has(wifeX + offset)) {
        offset += 90;
      }
      husband.x = husbandX + offset;
      wife.x = wifeX + offset;
    }

    // 부부 좌표 등록
    usedX.add(snapToGrid(husband.x));
    usedX.add(snapToGrid(wife.x));
    processedIds.add(couple.husbandId);
    processedIds.add(couple.wifeId);
  }

  // 4-3. 비-부부 개인 중복 체크
  for (const subject of output.subjects || []) {
    if (processedIds.has(subject.id)) continue;

    const gen = getGeneration(subject.y);
    if (!usedCoordsByGeneration.has(gen)) {
      usedCoordsByGeneration.set(gen, new Set());
    }
    const usedX = usedCoordsByGeneration.get(gen)!;
    const snappedX = snapToGrid(subject.x);

    let newX = snappedX;
    while (usedX.has(newX)) {
      newX += 90;
    }

    if (newX !== snappedX) {
      subject.x = newX;
    }
    usedX.add(subject.x);
  }

  // 4-4. Fetus도 같은 세대에서 x좌표 중복 체크
  for (let i = 0; i < (output.fetus?.length ?? 0); i++) {
    const fetus = output.fetus![i];
    if (fetus.length === 5) {
      const [fatherId, motherId, status, fetusX, fetusY] = fetus;
      const gen = getGeneration(fetusY);
      if (!usedCoordsByGeneration.has(gen)) {
        usedCoordsByGeneration.set(gen, new Set());
      }
      const usedX = usedCoordsByGeneration.get(gen)!;
      const snappedX = snapToGrid(fetusX);

      let newX = snappedX;
      while (usedX.has(newX)) {
        newX += 90;
      }

      if (newX !== snappedX) {
        output.fetus![i] = [fatherId, motherId, status, newX, fetusY];
      }
      usedX.add(newX);
    }
  }

  // 5. 같은 세대 부부 범위(minX~maxX) 겹침 시 가족 트리 통째 이동
  // 부부의 x 범위가 겹치면 나중에 처리되는 부부의 가족 트리 전체를 오른쪽으로 이동

  // 5-1. 세대별 부부 범위 정보 수집
  interface CoupleRange {
    husbandId: number;
    wifeId: number;
    minX: number;
    maxX: number;
    gen: Generation;
  }

  const coupleRanges: CoupleRange[] = [];
  for (const [husbandId, wifeId] of output.couples || []) {
    const husband = subjectById.get(husbandId);
    const wife = subjectById.get(wifeId);
    if (husband && wife) {
      const gen = getGeneration(husband.y);
      coupleRanges.push({
        husbandId,
        wifeId,
        minX: Math.min(husband.x, wife.x),
        maxX: Math.max(husband.x, wife.x),
        gen,
      });
    }
  }

  // minX 기준 정렬 (왼쪽 부부가 우선권)
  coupleRanges.sort((a, b) => a.minX - b.minX);

  // 5-2. 가족 트리 멤버 ID 수집 함수 (부부 + 자녀 + 자녀의 배우자 + 손자녀...)
  const getFamilyTreeIds = (
    coupleKey: string,
    visited: Set<string> = new Set()
  ): Set<number> => {
    if (visited.has(coupleKey)) return new Set();
    visited.add(coupleKey);

    const couple = coupleMap.get(coupleKey);
    if (!couple) return new Set();

    const ids = new Set<number>([couple.husbandId, couple.wifeId]);

    // 자녀들 추가
    for (const childId of couple.childrenIds) {
      ids.add(childId);

      // 자녀가 배우자가 있으면 그 가족 트리도 포함
      for (const [hId, wId] of output.couples || []) {
        if (hId === childId || wId === childId) {
          const childCoupleKey = `${hId}-${wId}`;
          const childFamilyIds = getFamilyTreeIds(childCoupleKey, visited);
          childFamilyIds.forEach((id) => ids.add(id));
        }
      }
    }

    return ids;
  };

  // 5-3. Fetus 인덱스 수집 함수
  const getFamilyFetusIndices = (
    coupleKey: string,
    visited: Set<string> = new Set()
  ): Set<number> => {
    if (visited.has(coupleKey)) return new Set();
    visited.add(coupleKey);

    const couple = coupleMap.get(coupleKey);
    if (!couple) return new Set();

    const indices = new Set<number>(couple.fetusIndices);

    // 자녀가 부부인 경우 그 fetus도 포함
    for (const childId of couple.childrenIds) {
      for (const [hId, wId] of output.couples || []) {
        if (hId === childId || wId === childId) {
          const childCoupleKey = `${hId}-${wId}`;
          const childFetusIndices = getFamilyFetusIndices(
            childCoupleKey,
            visited
          );
          childFetusIndices.forEach((idx) => indices.add(idx));
        }
      }
    }

    return indices;
  };

  // 5-4. 같은 세대에서 범위 겹침 체크 및 이동
  const processedCoupleKeys = new Set<string>();

  for (const range of coupleRanges) {
    const coupleKey = `${range.husbandId}-${range.wifeId}`;
    if (processedCoupleKeys.has(coupleKey)) continue;

    // 이미 처리된 부부들과 범위 겹침 체크
    for (const processedKey of processedCoupleKeys) {
      const processedCouple = coupleMap.get(processedKey);
      if (!processedCouple) continue;

      const processedHusband = subjectById.get(processedCouple.husbandId);
      const processedWife = subjectById.get(processedCouple.wifeId);
      if (!processedHusband || !processedWife) continue;

      const processedGen = getGeneration(processedHusband.y);
      if (processedGen !== range.gen) continue;

      const processedMinX = Math.min(processedHusband.x, processedWife.x);
      const processedMaxX = Math.max(processedHusband.x, processedWife.x);

      // 현재 부부 좌표 다시 계산 (이동했을 수 있음)
      const currentHusband = subjectById.get(range.husbandId);
      const currentWife = subjectById.get(range.wifeId);
      if (!currentHusband || !currentWife) continue;

      const currentMinX = Math.min(currentHusband.x, currentWife.x);
      const currentMaxX = Math.max(currentHusband.x, currentWife.x);

      // 범위 겹침 체크: rangeA.max > rangeB.min && rangeA.min < rangeB.max
      const hasOverlap =
        currentMaxX > processedMinX && currentMinX < processedMaxX;

      if (hasOverlap) {
        // 겹치면 현재 부부의 가족 트리 전체를 오른쪽으로 이동
        const offset = processedMaxX - currentMinX + 90; // 겹침 해소 + 여유 간격

        // 가족 트리 멤버 모두 이동
        const familyIds = getFamilyTreeIds(coupleKey);
        for (const id of familyIds) {
          const subject = subjectById.get(id);
          if (subject) {
            subject.x = snapToGrid(subject.x + offset);
          }
        }

        // 가족 트리의 Fetus도 이동
        const familyFetusIndices = getFamilyFetusIndices(coupleKey);
        for (const idx of familyFetusIndices) {
          const fetus = output.fetus?.[idx];
          if (fetus && fetus.length === 5) {
            const [fId, mId, st, fx, fy] = fetus;
            output.fetus![idx] = [fId, mId, st, snapToGrid(fx + offset), fy];
          }
        }
      }
    }

    processedCoupleKeys.add(coupleKey);
  }

  return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 변환 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI 출력 JSON을 Canvas SerializedGenogram으로 변환
 *
 * AI가 계산한 좌표를 그대로 사용하고, 그리드에 스냅합니다.
 * 후처리로 부부가 자녀를 감싸도록 보정합니다.
 */
export function convertAIJsonToCanvas(
  aiOutput: AIGenogramOutput
): SerializedGenogram {
  // 좌표 후처리 보정 적용
  const correctedOutput = postProcessCoordinates(aiOutput);
  const now = new Date();

  const subjects: SerializedGenogram['subjects'] = [];
  const connections: SerializedGenogram['connections'] = [];

  // AI 숫자 ID → 실제 ID 매핑
  const idMap = new Map<number, string>();

  // PERSON subjects 처리 (보정된 좌표 사용)
  for (const subject of correctedOutput.subjects || []) {
    if (subject.type === 'PERSON') {
      const realId = generateId('person');
      idMap.set(subject.id, realId);

      subjects.push({
        id: realId,
        entity: {
          type: SubjectType.Person,
          attribute: {
            gender: mapGender(subject.gender),
            name: subject.name ?? null,
            isIP: subject.isIP ?? false,
            isDead: subject.isDead ?? false,
            lifeSpan: {
              birth: normalizeYearToDate(subject.birthYear),
              death: normalizeYearToDate(subject.deathYear),
            },
            age: subject.age ?? null,
            illness: mapIllness(subject.illness),
            extraInfo: {
              enable: false,
              job: null,
              education: null,
              region: null,
            },
          },
          memo: subject.memo ?? null,
        },
        layout: {
          center: {
            x: snapToGrid(subject.x),
            y: snapToGrid(subject.y),
          },
          style: {
            size: subject.size === 'SMALL' ? NodeSize.Small : NodeSize.Default,
            bgColor: DEFAULT_BG,
            textColor: DEFAULT_FG,
          },
        },
      });
    }
  }

  // Fetus subjects 처리 (보정된 좌표 사용)
  const fetusIdMap = new Map<string, string>();
  let fetusIndex = 0;

  for (const fetusData of correctedOutput.fetus || []) {
    // postProcessCoordinates에서 5요소로 확장될 수 있음
    const fatherId = fetusData[0];
    const motherId = fetusData[1];
    const status = fetusData[2];
    // 보정된 x, y 좌표 (있으면 사용, 없으면 계산)
    const correctedX = fetusData[3] as number | undefined;
    const correctedY = fetusData[4] as number | undefined;

    const key = `${fatherId}-${motherId}-${fetusIndex++}`;
    const realId = generateId('fetus');
    fetusIdMap.set(key, realId);

    // 보정된 좌표가 있으면 사용, 없으면 부모 위치 기반으로 계산
    let x = correctedX ?? 15;
    let y = correctedY ?? 165;

    if (correctedX === undefined || correctedY === undefined) {
      const fatherSubject = correctedOutput.subjects.find(
        (s) => s.id === fatherId
      );
      const motherSubject = correctedOutput.subjects.find(
        (s) => s.id === motherId
      );

      if (fatherSubject && motherSubject) {
        x = (fatherSubject.x + motherSubject.x) / 2;
        y = Math.max(fatherSubject.y, motherSubject.y) + 150;
      } else if (fatherSubject) {
        x = fatherSubject.x;
        y = fatherSubject.y + 150;
      } else if (motherSubject) {
        x = motherSubject.x;
        y = motherSubject.y + 150;
      }
    }

    subjects.push({
      id: realId,
      entity: {
        type: SubjectType.Fetus,
        attribute: {
          name: null,
          status: mapFetusStatus(status),
        },
        memo: status,
      },
      layout: {
        center: {
          x: snapToGrid(x),
          y: snapToGrid(y),
        },
        style: {
          size: NodeSize.Small,
          bgColor: DEFAULT_BG,
          textColor: DEFAULT_FG,
        },
      },
    });
  }

  // Partner Lines 생성
  const partnerLineMap = new Map<string, string>();

  for (const [husbandId, wifeId, status] of aiOutput.couples || []) {
    const realHusbandId = idMap.get(husbandId);
    const realWifeId = idMap.get(wifeId);

    if (!realHusbandId || !realWifeId) continue;

    const connectionId = generateId('partner');
    partnerLineMap.set(`${husbandId}-${wifeId}`, connectionId);
    partnerLineMap.set(`${wifeId}-${husbandId}`, connectionId);

    connections.push({
      id: connectionId,
      entity: {
        type: ConnectionType.Partner_Line,
        attribute: {
          status: mapPartnerStatus(status),
          subjects: [realHusbandId, realWifeId],
          detail: {
            marriedDate: null,
            divorcedDate: null,
            reunitedDate: null,
            relationshipStartDate: null,
          },
        },
        memo: null,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  }

  // Children Lines 생성
  for (const [fatherId, motherId, childId, status] of aiOutput.children || []) {
    const realChildId = idMap.get(childId);
    if (!realChildId) continue;

    // 부모 Partner Line 찾기
    const key1 = `${fatherId}-${motherId}`;
    const key2 = `${motherId}-${fatherId}`;
    let parentRef = partnerLineMap.get(key1) ?? partnerLineMap.get(key2);

    // Partner Line이 없으면 부모 중 한 명의 ID 사용
    if (!parentRef) {
      parentRef =
        (fatherId != null ? idMap.get(fatherId) : undefined) ??
        (motherId != null ? idMap.get(motherId) : undefined);
    }

    if (!parentRef) continue;

    connections.push({
      id: generateId('parentchild'),
      entity: {
        type: ConnectionType.Children_Parents_Line,
        attribute: {
          status: mapChildStatus(status),
          parentRef,
          childRef: realChildId,
        },
        memo: null,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  }

  // Fetus Lines 생성
  fetusIndex = 0;
  for (const [fatherId, motherId, status] of aiOutput.fetus || []) {
    const key = `${fatherId}-${motherId}-${fetusIndex++}`;
    const realFetusId = fetusIdMap.get(key);
    if (!realFetusId) continue;

    // 부모 Partner Line 찾기
    const key1 = `${fatherId}-${motherId}`;
    const key2 = `${motherId}-${fatherId}`;
    let parentRef = partnerLineMap.get(key1) ?? partnerLineMap.get(key2);

    if (!parentRef) {
      parentRef =
        (fatherId != null ? idMap.get(fatherId) : undefined) ??
        (motherId != null ? idMap.get(motherId) : undefined);
    }

    if (!parentRef) continue;

    connections.push({
      id: generateId('parentchild'),
      entity: {
        type: ConnectionType.Children_Parents_Line,
        attribute: {
          status: mapFetusToChildStatus(status),
          parentRef,
          childRef: realFetusId,
        },
        memo: status,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  }

  // Relation Lines 생성
  for (const [id1, id2, description] of aiOutput.relations || []) {
    const realId1 = idMap.get(id1);
    const realId2 = idMap.get(id2);

    if (!realId1 || !realId2) continue;

    connections.push({
      id: generateId('relation'),
      entity: {
        type: ConnectionType.Relation_Line,
        attribute: {
          status: mapRelationStatus(description),
          subjects: [realId1, realId2],
        },
        memo: description,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  }

  // SerializedGenogram 반환
  return {
    id: generateId('genogram'),
    version: 'v1',
    metadata: {
      title: 'AI 생성 가계도',
      createdAt: now,
      updatedAt: now,
    },
    subjects,
    connections,
    annotations: [],
    view: {
      viewPoint: { center: { x: 0, y: 0 }, zoom: 1 },
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
    },
  };
}

/**
 * AI JSON 유효성 검사
 */
export function isValidAIJson(json: unknown): json is AIGenogramOutput {
  if (typeof json !== 'object' || json === null) return false;

  const obj = json as Record<string, unknown>;

  // subjects 배열 필수
  if (!Array.isArray(obj.subjects)) return false;

  // 최소 1명의 사람이 있어야 함
  if (obj.subjects.length === 0) return false;

  // 각 subject 검증
  for (const subject of obj.subjects) {
    if (typeof subject !== 'object' || subject === null) return false;
    const s = subject as Record<string, unknown>;
    if (typeof s.id !== 'number') return false;
    if (typeof s.x !== 'number') return false;
    if (typeof s.y !== 'number') return false;
  }

  return true;
}
