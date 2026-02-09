import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import {
  ConnectionType,
  FetusStatus,
  Gender,
  Illness,
  InfluenceStatus,
  NodeSize,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
  StrokeWidth,
  SubjectType,
} from '@/genogram/core/types/enums';

// ─────────────────────────────────────── 상수 ──────────────────────────────────────

// 그리드 및 스타일 상수
const GRID_SIZE = 30;
const DEFAULT_BG = '#FFFFFF';
const DEFAULT_FG = '#3C3C3C';

// 좌표 계산 상수
const BASE_X = 15; // X 좌표 기준점
const BASE_Y = 15; // Y 좌표 기준점 (IP 세대)
const Y_GENERATION_GAP = 150; // 세대 간 Y 간격
const X_SIBLING_GAP = 90; // 형제 간 X 간격
const MIN_COUPLE_GAP = 90; // 부부 간 최소 X 간격
const COUPLE_SLOT_COUNT = 2; // 부부가 차지하는 슬롯 수
const SINGLE_SLOT_COUNT = 1; // 개인이 차지하는 슬롯 수
const TREE_GAP_SLOTS = 1; // 트리 간 슬롯 간격

// 기본값 상수
const DEFAULT_GENERATION = 0; // 기본 세대 (IP 세대)
const CHILD_GENERATION_OFFSET = 1; // 자녀 세대 오프셋
const DEFAULT_BIRTH_ORDER = 999; // birthOrder 기본값 (정렬 시 뒤로)
const DEFAULT_SIBLING_INDEX = 0; // 기본 형제 인덱스
const DEFAULT_SIBLING_COUNT = 1; // 기본 형제 수
const DEFAULT_COUPLE_OFFSET = 0; // 기본 부부 오프셋
const SPOUSE_COUPLE_OFFSET = 1; // 배우자 부부 오프셋

// 연도 유효성 검사 상수
const MIN_VALID_YEAR = 1000;
const MAX_VALID_YEAR = 9999;
const YEAR_PATTERN_LENGTH = 4;
const DATE_PATTERN_LENGTH = 8;

// ID 생성 상수
const UUID_START_INDEX = 2;
const UUID_END_INDEX = 9;

// ─────────────────────────────────────────────────────────────────────────────
// AI 출력 타입 (summary.ts에서 반환하는 형식 - 좌표 없음)
// ─────────────────────────────────────────────────────────────────────────────

export type AIPartnerStatus =
  | 'marriage'
  | 'divorced'
  | 'separated'
  | 'cohabiting'
  | 'engaged';

export type AIChildStatus = 'biological' | 'adopted' | 'foster';

export type AIInfluenceStatus =
  | 'physical_abuse'
  | 'emotional_abuse'
  | 'sexual_abuse'
  | 'focused_on'
  | 'focused_on_negatively';

/** 형제자매 그룹 (같은 부모를 공유) */
export interface AISiblingGroup {
  parentCoupleKey: string; // "fatherId-motherId" 형식
  siblingIds: number[]; // birthOrder 순서로 정렬됨
}

/** 최소단위 가족 (부부 + 직계 자녀) */
export interface AINuclearFamily {
  husbandId: number | null;
  wifeId: number | null;
  childrenIds: number[]; // birthOrder 순서로 정렬됨
  generation: number; // 0=IP세대, -1=부모, -2=조부모, 1=자녀, 2=손자녀
}

/** AI가 출력하는 개인 정보 (좌표 없음) */
export interface AISubject {
  id: number;
  type: 'PERSON';
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
  size?: 'DEFAULT' | 'SMALL';
  birthOrder?: number;
  spouseId?: number;
  birthYear?: number | string | null;
  deathYear?: number | string | null;
  age?: number | null;
  job?: string | null;
  education?: string | null;
  region?: string | null;
}

/** AI가 출력하는 가계도 데이터 (좌표 없음, 인접 리스트 포함) */
export interface AIGenogramOutput {
  subjects: AISubject[];
  partners: [number, number, AIPartnerStatus?, string?][]; // [id1, id2, status?, memo?]
  children: [number | null, number | null, number, AIChildStatus?, string?][]; // [fatherId, motherId, childId, status?, memo?]
  fetus: [number | null, number | null, string][]; // [fatherId, motherId, status]
  relations: [number, number, string][]; // [id1, id2, description]
  influences: [number, number, AIInfluenceStatus, string?][]; // [fromId, toId, status, memo?]
  siblingGroups: AISiblingGroup[];
  nuclearFamilies: AINuclearFamily[];
}

/** 좌표가 계산된 Subject */
interface SubjectWithCoords extends AISubject {
  x: number;
  y: number;
}

/** 좌표가 계산된 Fetus */
interface FetusWithCoords {
  fatherId: number | null;
  motherId: number | null;
  status: string;
  x: number;
  y: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────────────────────────────────────

function snapToGrid(value: number): number {
  const n = Math.round((value - BASE_X) / GRID_SIZE);
  return n * GRID_SIZE + BASE_X;
}

function generateId(prefix: string): string {
  const timestamp = Date.now();
  const uuid = Math.random()
    .toString(36)
    .substring(UUID_START_INDEX, UUID_END_INDEX);
  return `${prefix}-${timestamp}-${uuid}`;
}

function normalizeYearToDate(
  year: number | string | null | undefined
): string | null {
  if (year === null || year === undefined) return null;
  const yearStr = String(year).trim();
  if (!yearStr) return null;
  const datePattern = new RegExp(`^\\d{${DATE_PATTERN_LENGTH}}$`);
  const yearPattern = new RegExp(`^\\d{${YEAR_PATTERN_LENGTH}}$`);
  if (datePattern.test(yearStr)) return yearStr;
  if (yearPattern.test(yearStr)) return `${yearStr}0101`;
  const numYear = Number(yearStr);
  if (
    !isNaN(numYear) &&
    numYear >= MIN_VALID_YEAR &&
    numYear <= MAX_VALID_YEAR
  ) {
    return `${numYear}0101`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 상태 매핑 함수
// ─────────────────────────────────────────────────────────────────────────────

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

function mapPartnerStatus(
  status?: AIPartnerStatus
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

function mapFetusStatus(
  status: string
): (typeof FetusStatus)[keyof typeof FetusStatus] {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy'))
    return FetusStatus.Pregnancy;
  if (lower.includes('낙태') || lower.includes('abortion'))
    return FetusStatus.Abortion;
  return FetusStatus.Miscarriage;
}

function mapFetusToChildStatus(
  status: string
): (typeof ParentChildStatus)[keyof typeof ParentChildStatus] {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy'))
    return ParentChildStatus.Pregnancy;
  if (lower.includes('낙태') || lower.includes('abortion'))
    return ParentChildStatus.Abortion;
  return ParentChildStatus.Miscarriage;
}

function mapRelationStatus(
  description: string
): (typeof RelationStatus)[keyof typeof RelationStatus] {
  const lower = description.toLowerCase();
  if (
    lower.includes('친밀') ||
    lower.includes('가까') ||
    lower.includes('close')
  )
    return RelationStatus.Close;
  if (lower.includes('융합') || lower.includes('fused'))
    return RelationStatus.Fused;
  if (
    lower.includes('소원') ||
    lower.includes('distant') ||
    lower.includes('거리')
  )
    return RelationStatus.Distant;
  if (
    lower.includes('적대') ||
    lower.includes('갈등') ||
    lower.includes('hostile')
  )
    return RelationStatus.Hostile;
  if (lower.includes('단절') || lower.includes('cutoff'))
    return RelationStatus.Cutoff;
  return RelationStatus.Connected;
}

function mapInfluenceStatus(
  status: AIInfluenceStatus
): (typeof InfluenceStatus)[keyof typeof InfluenceStatus] {
  switch (status) {
    case 'physical_abuse':
      return InfluenceStatus.Physical_Abuse;
    case 'emotional_abuse':
      return InfluenceStatus.Emotional_Abuse;
    case 'sexual_abuse':
      return InfluenceStatus.Sexual_Abuse;
    case 'focused_on':
      return InfluenceStatus.Focused_On;
    case 'focused_on_negatively':
      return InfluenceStatus.Focused_On_Negatively;
    default:
      return InfluenceStatus.Focused_On;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 좌표 계산 로직 (공식 기반 - Formula-Based Layout)
// ─────────────────────────────────────────────────────────────────────────────

interface LayoutResult {
  subjects: SubjectWithCoords[];
  fetuses: FetusWithCoords[];
}

/**
 * 공식 기반 좌표 계산
 *
 * ═══════════════════════════════════════════════════════════════════
 * X 좌표 공식:
 * ═══════════════════════════════════════════════════════════════════
 *
 * 1. 기본 X (형제 중 위치):
 *    baseX = treeOffset + siblingIndex × SIBLING_GAP
 *
 * 2. 부부 보정:
 *    - 남편: baseX (그대로)
 *    - 아내: baseX + COUPLE_GAP
 *
 * 3. 세대 내 중앙 정렬은 하지 않음 (트리 구조 유지)
 *
 * ═══════════════════════════════════════════════════════════════════
 * Y 좌표 공식:
 * ═══════════════════════════════════════════════════════════════════
 *
 * Y = BASE_Y + generation × GENERATION_GAP
 *
 */
function calculateCoordinates(aiOutput: AIGenogramOutput): LayoutResult {
  const { subjects, partners, fetus, nuclearFamilies, siblingGroups } =
    aiOutput;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. 기본 맵 구축
  // ─────────────────────────────────────────────────────────────────────────
  const subjectById = new Map<number, AISubject>();
  for (const s of subjects) {
    subjectById.set(s.id, s);
  }

  // 배우자 맵
  const spouseMap = new Map<number, number>();
  for (const [id1, id2] of partners) {
    spouseMap.set(id1, id2);
    spouseMap.set(id2, id1);
  }

  // Fetus 정보
  const fetusInfoList = fetus.map(([fatherId, motherId, status], index) => ({
    id: `fetus-${index}`,
    fatherId,
    motherId,
    status,
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // 2. 세대 정보 추출
  // ─────────────────────────────────────────────────────────────────────────
  const generations = new Map<number, number>();

  for (const nf of nuclearFamilies) {
    if (nf.husbandId) generations.set(nf.husbandId, nf.generation);
    if (nf.wifeId) generations.set(nf.wifeId, nf.generation);
    for (const childId of nf.childrenIds) {
      generations.set(childId, nf.generation + CHILD_GENERATION_OFFSET);
    }
  }

  // 세대 정보가 없는 인물 처리 (고아 노드)
  for (const s of subjects) {
    if (!generations.has(s.id)) {
      generations.set(s.id, DEFAULT_GENERATION);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 독립 트리 식별 및 슬롯 할당
  // ─────────────────────────────────────────────────────────────────────────

  // siblingGroup별로 자녀들의 슬롯 인덱스 계산
  // 각 siblingGroup은 연속된 슬롯을 차지

  interface SlotInfo {
    slotIndex: number; // 전역 슬롯 인덱스
    siblingIndex: number; // 형제 중 순서
    siblingCount: number; // 형제 수
    coupleSlotOffset: number; // 배우자일 경우 추가 오프셋
  }

  const slotInfoMap = new Map<number, SlotInfo>();
  const fetusSlotMap = new Map<string, SlotInfo>();

  // 각 nuclearFamily를 세대순 정렬
  const sortedFamilies = [...nuclearFamilies].sort(
    (a, b) => a.generation - b.generation
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Junction couple 식별: 두 배우자 모두 siblingGroup에 속한 경우
  // 이들은 각자의 siblingGroup에서 개별적으로 위치가 결정됨
  // ─────────────────────────────────────────────────────────────────────────
  const siblingGroupMemberIds = new Set<number>();
  for (const sg of siblingGroups) {
    for (const id of sg.siblingIds) {
      siblingGroupMemberIds.add(id);
    }
  }

  const junctionCouples = new Set<number>(); // 양쪽 다 siblingGroup 소속인 부부
  for (const [id1, id2] of partners) {
    if (siblingGroupMemberIds.has(id1) && siblingGroupMemberIds.has(id2)) {
      junctionCouples.add(id1);
      junctionCouples.add(id2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // siblingGroups를 세대 순서로 정렬 (조부모 → 부모 → IP → 자녀)
  // ─────────────────────────────────────────────────────────────────────────
  const ipSubject = subjects.find((s) => s.isIP);
  const ipIsFemale = ipSubject?.gender === 'Female';
  const ipId = ipSubject?.id;
  const ipSpouseId = ipId ? spouseMap.get(ipId) : undefined;

  // 각 siblingGroup의 세대 계산 (자녀들의 세대)
  const getSiblingGroupGeneration = (sg: AISiblingGroup): number => {
    // siblingGroup의 첫 번째 멤버의 세대를 기준으로
    const firstSiblingId = sg.siblingIds[0];
    if (firstSiblingId !== undefined) {
      return generations.get(firstSiblingId) ?? DEFAULT_GENERATION;
    }
    return DEFAULT_GENERATION;
  };

  // siblingGroups를 세대 순서로 정렬 (낮은 세대 = 윗 세대가 먼저)
  const orderedSiblingGroups = [...siblingGroups].sort((a, b) => {
    const genA = getSiblingGroupGeneration(a);
    const genB = getSiblingGroupGeneration(b);
    return genA - genB;
  });

  // IP가 여성이고 junction couple인 경우, 같은 세대 내에서 배우자 가족을 앞으로
  if (ipIsFemale && ipId && ipSpouseId && junctionCouples.has(ipId)) {
    // 같은 세대의 siblingGroups만 필터링하여 순서 조정
    const ipSiblingGroupIndex = orderedSiblingGroups.findIndex((sg) =>
      sg.siblingIds.includes(ipId)
    );
    const spouseSiblingGroupIndex = orderedSiblingGroups.findIndex((sg) =>
      sg.siblingIds.includes(ipSpouseId)
    );

    // 배우자 siblingGroup을 IP siblingGroup보다 앞으로 이동 (같은 세대 내에서만)
    if (
      ipSiblingGroupIndex !== -1 &&
      spouseSiblingGroupIndex !== -1 &&
      spouseSiblingGroupIndex > ipSiblingGroupIndex &&
      getSiblingGroupGeneration(orderedSiblingGroups[ipSiblingGroupIndex]) ===
        getSiblingGroupGeneration(orderedSiblingGroups[spouseSiblingGroupIndex])
    ) {
      const temp = orderedSiblingGroups[ipSiblingGroupIndex];
      orderedSiblingGroups[ipSiblingGroupIndex] =
        orderedSiblingGroups[spouseSiblingGroupIndex];
      orderedSiblingGroups[spouseSiblingGroupIndex] = temp;
    }
  }

  // 트리별 슬롯 시작 위치 추적
  let currentSlot = 0;
  const processedIds = new Set<number>();

  // siblingGroup 기반 슬롯 할당 (IP 성별에 따라 순서 조정됨)
  for (const sg of orderedSiblingGroups) {
    const siblingIds = sg.siblingIds;
    const siblingCount = siblingIds.length;

    // Fetus 개수 추가
    const fetusCount = fetusInfoList.filter(
      (f) => `${f.fatherId}-${f.motherId}` === sg.parentCoupleKey
    ).length;
    const totalCount = siblingCount + fetusCount;

    // birthOrder로 정렬
    const sortedSiblings = [...siblingIds].sort((a, b) => {
      const aSubject = subjectById.get(a);
      const bSubject = subjectById.get(b);
      return (
        (aSubject?.birthOrder ?? DEFAULT_BIRTH_ORDER) -
        (bSubject?.birthOrder ?? DEFAULT_BIRTH_ORDER)
      );
    });

    // 각 형제에게 슬롯 할당
    sortedSiblings.forEach((id, index) => {
      if (processedIds.has(id)) return;

      const hasSpouse = spouseMap.has(id);
      const subject = subjectById.get(id);
      const isMale = subject?.gender === 'Male';

      // 배우자가 있고, 배우자가 아직 처리 안됐으면 한 쌍으로 처리
      const spouseId = spouseMap.get(id);
      const spouseProcessed = spouseId ? processedIds.has(spouseId) : true;

      // Junction couple이면 각자 siblingGroup에서 개별 처리
      const isJunctionCouple = junctionCouples.has(id);

      if (hasSpouse && !spouseProcessed && spouseId && !isJunctionCouple) {
        // 일반 부부: 연속 슬롯 (남편 먼저, 아내 다음)
        if (isMale) {
          slotInfoMap.set(id, {
            slotIndex: currentSlot,
            siblingIndex: index,
            siblingCount: totalCount,
            coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
          });
          slotInfoMap.set(spouseId, {
            slotIndex: currentSlot,
            siblingIndex: index,
            siblingCount: totalCount,
            coupleSlotOffset: SPOUSE_COUPLE_OFFSET,
          });
        } else {
          slotInfoMap.set(spouseId, {
            slotIndex: currentSlot,
            siblingIndex: index,
            siblingCount: totalCount,
            coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
          });
          slotInfoMap.set(id, {
            slotIndex: currentSlot,
            siblingIndex: index,
            siblingCount: totalCount,
            coupleSlotOffset: SPOUSE_COUPLE_OFFSET,
          });
        }

        processedIds.add(id);
        processedIds.add(spouseId);
        currentSlot += COUPLE_SLOT_COUNT;
      } else if (!processedIds.has(id)) {
        // Junction couple이거나 배우자 없는 경우: 개별 슬롯
        slotInfoMap.set(id, {
          slotIndex: currentSlot,
          siblingIndex: index,
          siblingCount: totalCount,
          coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
        });
        processedIds.add(id);
        currentSlot += SINGLE_SLOT_COUNT;
      }
    });

    // Fetus 슬롯 할당
    const relatedFetuses = fetusInfoList.filter(
      (f) => `${f.fatherId}-${f.motherId}` === sg.parentCoupleKey
    );
    relatedFetuses.forEach((f, fIndex) => {
      fetusSlotMap.set(f.id, {
        slotIndex: currentSlot,
        siblingIndex: siblingCount + fIndex,
        siblingCount: totalCount,
        coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
      });
      currentSlot += SINGLE_SLOT_COUNT;
    });

    // 트리 간 간격
    currentSlot += TREE_GAP_SLOTS;
  }

  // nuclearFamily의 부모 중 아직 처리 안된 인물 처리
  for (const nf of sortedFamilies) {
    for (const parentId of [nf.husbandId, nf.wifeId]) {
      if (parentId && !processedIds.has(parentId)) {
        const hasSpouse = spouseMap.has(parentId);
        const spouseId = spouseMap.get(parentId);
        const subject = subjectById.get(parentId);
        const isMale = subject?.gender === 'Male';

        if (hasSpouse && spouseId && !processedIds.has(spouseId)) {
          if (isMale) {
            slotInfoMap.set(parentId, {
              slotIndex: currentSlot,
              siblingIndex: DEFAULT_SIBLING_INDEX,
              siblingCount: DEFAULT_SIBLING_COUNT,
              coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
            });
            slotInfoMap.set(spouseId, {
              slotIndex: currentSlot,
              siblingIndex: DEFAULT_SIBLING_INDEX,
              siblingCount: DEFAULT_SIBLING_COUNT,
              coupleSlotOffset: SPOUSE_COUPLE_OFFSET,
            });
          } else {
            slotInfoMap.set(spouseId, {
              slotIndex: currentSlot,
              siblingIndex: DEFAULT_SIBLING_INDEX,
              siblingCount: DEFAULT_SIBLING_COUNT,
              coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
            });
            slotInfoMap.set(parentId, {
              slotIndex: currentSlot,
              siblingIndex: DEFAULT_SIBLING_INDEX,
              siblingCount: DEFAULT_SIBLING_COUNT,
              coupleSlotOffset: SPOUSE_COUPLE_OFFSET,
            });
          }
          processedIds.add(parentId);
          processedIds.add(spouseId);
          currentSlot += COUPLE_SLOT_COUNT;
        } else {
          slotInfoMap.set(parentId, {
            slotIndex: currentSlot,
            siblingIndex: DEFAULT_SIBLING_INDEX,
            siblingCount: DEFAULT_SIBLING_COUNT,
            coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
          });
          processedIds.add(parentId);
          currentSlot += SINGLE_SLOT_COUNT;
        }
      }
    }
  }

  // 고아 노드(처리되지 않은 인물)는 최종 결과에서 제외됨 (아래 필터링 단계에서 삭제)

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 공식 적용하여 초기 좌표 계산
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * X 좌표 공식:
   * X = BASE_X + slotIndex × SIBLING_GAP + coupleSlotOffset × COUPLE_GAP
   */
  const calculateX = (slotInfo: SlotInfo): number => {
    const baseX = BASE_X + slotInfo.slotIndex * X_SIBLING_GAP;
    const coupleOffset = slotInfo.coupleSlotOffset * MIN_COUPLE_GAP;
    return baseX + coupleOffset;
  };

  /**
   * Y 좌표 공식:
   * Y = BASE_Y + generation × GENERATION_GAP
   */
  const calculateY = (generation: number): number => {
    return BASE_Y + generation * Y_GENERATION_GAP;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Junction couple 하위 트리 식별 (자손 전체에 Y offset 적용)
  // ─────────────────────────────────────────────────────────────────────────
  const junctionDescendants = new Set<number>();

  // Junction couple의 자녀들을 시작점으로 하위 트리 탐색
  const findDescendants = (parentIds: number[]) => {
    for (const nf of nuclearFamilies) {
      const isParentJunction =
        (nf.husbandId && parentIds.includes(nf.husbandId)) ||
        (nf.wifeId && parentIds.includes(nf.wifeId));
      if (isParentJunction) {
        for (const childId of nf.childrenIds) {
          if (!junctionDescendants.has(childId)) {
            junctionDescendants.add(childId);
            // 자녀의 배우자도 포함
            const spouseId = spouseMap.get(childId);
            if (spouseId) junctionDescendants.add(spouseId);
          }
        }
      }
    }
  };

  // Junction couple의 자녀들 찾기
  const junctionParentIds = Array.from(junctionCouples);
  findDescendants(junctionParentIds);

  // 자녀들의 자녀들도 재귀적으로 찾기 (손자녀, 증손자녀 등)
  let prevSize = 0;
  while (junctionDescendants.size > prevSize) {
    prevSize = junctionDescendants.size;
    findDescendants(Array.from(junctionDescendants));
  }

  // 초기 좌표 계산 (후처리 전)
  const xPositions = new Map<number, number>();
  const yPositions = new Map<number, number>();

  for (const s of subjects) {
    const slotInfo = slotInfoMap.get(s.id) ?? {
      slotIndex: DEFAULT_SIBLING_INDEX,
      siblingIndex: DEFAULT_SIBLING_INDEX,
      siblingCount: DEFAULT_SIBLING_COUNT,
      coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
    };
    const gen = generations.get(s.id) ?? DEFAULT_GENERATION;
    xPositions.set(s.id, calculateX(slotInfo));
    // Junction couple 및 하위 트리 전체에 Y + 90
    const needsYOffset =
      junctionCouples.has(s.id) || junctionDescendants.has(s.id);
    const yOffset = needsYOffset ? MIN_COUPLE_GAP : DEFAULT_COUPLE_OFFSET;
    yPositions.set(s.id, calculateY(gen) + yOffset);
  }

  // Fetus 초기 좌표
  const fetusXPositions = new Map<string, number>();
  const fetusYPositions = new Map<string, number>();

  for (const f of fetusInfoList) {
    const slotInfo = fetusSlotMap.get(f.id) ?? {
      slotIndex: DEFAULT_SIBLING_INDEX,
      siblingIndex: DEFAULT_SIBLING_INDEX,
      siblingCount: DEFAULT_SIBLING_COUNT,
      coupleSlotOffset: DEFAULT_COUPLE_OFFSET,
    };
    const fatherGen = f.fatherId ? generations.get(f.fatherId) : null;
    const motherGen = f.motherId ? generations.get(f.motherId) : null;
    const parentGen = fatherGen ?? motherGen ?? DEFAULT_GENERATION;
    // Fetus도 junction 하위면 Y offset 적용
    const parentIsJunction =
      (f.fatherId &&
        (junctionCouples.has(f.fatherId) ||
          junctionDescendants.has(f.fatherId))) ||
      (f.motherId &&
        (junctionCouples.has(f.motherId) ||
          junctionDescendants.has(f.motherId)));
    const fetusYOffset = parentIsJunction
      ? MIN_COUPLE_GAP
      : DEFAULT_COUPLE_OFFSET;
    fetusXPositions.set(f.id, calculateX(slotInfo));
    fetusYPositions.set(
      f.id,
      calculateY(parentGen + CHILD_GENERATION_OFFSET) + fetusYOffset
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 후처리: 부모 위치를 자녀 기준으로 조정
  // ─────────────────────────────────────────────────────────────────────────
  //
  // 일반 부부:
  //   자녀들의 X 좌표에서 minX, maxX 계산
  //   아버지 X = minX - 90
  //   어머니 X = maxX + 90
  //
  // Junction couple (양쪽 다 siblingGroup에 속한 부부):
  //   각자 siblingGroup 위치 유지
  //   자녀들을 부모 중간 지점 아래에 배치
  //

  // 먼저 junction couple의 자녀 위치 조정
  for (const nf of nuclearFamilies) {
    const { husbandId, wifeId, childrenIds } = nf;

    // 자녀가 없으면 스킵
    if (childrenIds.length === 0) continue;

    const isJunctionFamily =
      (husbandId && junctionCouples.has(husbandId)) ||
      (wifeId && junctionCouples.has(wifeId));

    if (isJunctionFamily) {
      // Junction couple: 자녀를 부모 중간 지점 아래에 배치
      const husbandX = husbandId ? xPositions.get(husbandId) : undefined;
      const wifeX = wifeId ? xPositions.get(wifeId) : undefined;

      if (husbandX !== undefined && wifeX !== undefined) {
        const parentMidX = (husbandX + wifeX) / 2;
        const childCount = childrenIds.length;

        // 자녀들을 중간 지점 주변에 배치 (birthOrder 순서)
        const sortedChildren = [...childrenIds].sort((a, b) => {
          const aSubject = subjectById.get(a);
          const bSubject = subjectById.get(b);
          return (
            (aSubject?.birthOrder ?? DEFAULT_BIRTH_ORDER) -
            (bSubject?.birthOrder ?? DEFAULT_BIRTH_ORDER)
          );
        });

        sortedChildren.forEach((childId, index) => {
          // 자녀 중앙을 parentMidX에 맞춤
          const childOffset = index - (childCount - 1) / 2;
          const childX = parentMidX + childOffset * X_SIBLING_GAP;

          // 자녀의 배우자도 함께 이동
          const childSpouseId = spouseMap.get(childId);
          const childSubject = subjectById.get(childId);
          const childIsMale = childSubject?.gender === 'Male';

          if (childSpouseId && !junctionCouples.has(childId)) {
            if (childIsMale) {
              xPositions.set(childId, childX);
              xPositions.set(childSpouseId, childX + MIN_COUPLE_GAP);
            } else {
              xPositions.set(childSpouseId, childX);
              xPositions.set(childId, childX + MIN_COUPLE_GAP);
            }
          } else {
            xPositions.set(childId, childX);
          }
        });

        // Fetus도 자녀 뒤에 배치
        const coupleKey = `${husbandId}-${wifeId}`;
        const relatedFetuses = fetusInfoList.filter(
          (f) => `${f.fatherId}-${f.motherId}` === coupleKey
        );
        relatedFetuses.forEach((f, fIndex) => {
          const fetusOffset =
            childCount + fIndex - (childCount + relatedFetuses.length - 1) / 2;
          fetusXPositions.set(f.id, parentMidX + fetusOffset * X_SIBLING_GAP);
        });
      }
    }
  }

  // 일반 부부의 위치 조정 (자녀 기준으로 wrap)
  for (const nf of nuclearFamilies) {
    const { husbandId, wifeId, childrenIds } = nf;

    // 자녀가 없으면 스킵
    if (childrenIds.length === 0) continue;

    const isJunctionFamily =
      (husbandId && junctionCouples.has(husbandId)) ||
      (wifeId && junctionCouples.has(wifeId));

    // Junction couple은 이미 처리됨
    if (isJunctionFamily) continue;

    // 자녀들의 X 좌표 수집
    const childXValues: number[] = [];
    for (const childId of childrenIds) {
      const childX = xPositions.get(childId);
      if (childX !== undefined) {
        childXValues.push(childX);

        // 자녀의 배우자도 포함 (단, junction couple의 배우자는 제외)
        const childSpouseId = spouseMap.get(childId);
        if (childSpouseId && !junctionCouples.has(childSpouseId)) {
          const spouseX = xPositions.get(childSpouseId);
          if (spouseX !== undefined) {
            childXValues.push(spouseX);
          }
        }
      }
    }

    // 해당 부부의 Fetus X도 포함
    const coupleKey = `${husbandId}-${wifeId}`;
    for (const f of fetusInfoList) {
      if (`${f.fatherId}-${f.motherId}` === coupleKey) {
        const fetusX = fetusXPositions.get(f.id);
        if (fetusX !== undefined) {
          childXValues.push(fetusX);
        }
      }
    }

    if (childXValues.length === 0) continue;

    const minX = Math.min(...childXValues);
    const maxX = Math.max(...childXValues);

    // 부모 위치 조정
    if (husbandId) {
      xPositions.set(husbandId, minX - MIN_COUPLE_GAP);
    }
    if (wifeId) {
      xPositions.set(wifeId, maxX + MIN_COUPLE_GAP);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. 부부 X 좌표 검증 및 교환 (부 X > 모 X 이면 교환)
  // ─────────────────────────────────────────────────────────────────────────
  for (const [id1, id2] of partners) {
    const subject1 = subjectById.get(id1);
    const x1 = xPositions.get(id1);
    const x2 = xPositions.get(id2);

    if (x1 === undefined || x2 === undefined) continue;

    // 남편과 아내 식별
    const id1IsMale = subject1?.gender === 'Male';
    const husbandId = id1IsMale ? id1 : id2;
    const wifeId = id1IsMale ? id2 : id1;
    const husbandX = xPositions.get(husbandId);
    const wifeX = xPositions.get(wifeId);

    if (husbandX !== undefined && wifeX !== undefined && husbandX > wifeX) {
      // 부 X가 모 X보다 크면 교환
      xPositions.set(husbandId, wifeX);
      xPositions.set(wifeId, husbandX);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. 좌표 충돌 검사 및 이동 (같은 Y에서 같은 X를 가진 인물 처리)
  // ─────────────────────────────────────────────────────────────────────────
  // Y 좌표별로 인물들을 그룹화
  const positionsByY = new Map<number, Map<number, number[]>>(); // Y -> (X -> [ids])

  for (const [id, x] of xPositions) {
    const y = yPositions.get(id);
    if (y === undefined) continue;

    if (!positionsByY.has(y)) {
      positionsByY.set(y, new Map());
    }
    const xMap = positionsByY.get(y)!;
    if (!xMap.has(x)) {
      xMap.set(x, []);
    }
    xMap.get(x)!.push(id);
  }

  // 충돌하는 인물들 이동 (같은 X, Y에 여러 명이 있는 경우)
  for (const [_y, xMap] of positionsByY) {
    for (const [x, ids] of xMap) {
      if (ids.length <= 1) continue;

      // 충돌 발생! 두 번째 인물부터 오른쪽으로 이동
      for (let i = 1; i < ids.length; i++) {
        const id = ids[i];
        const newX = x + i * MIN_COUPLE_GAP;
        xPositions.set(id, newX);

        // 배우자도 함께 이동
        const spouseId = spouseMap.get(id);
        if (spouseId) {
          const spouseX = xPositions.get(spouseId);
          if (spouseX !== undefined) {
            xPositions.set(spouseId, spouseX + i * MIN_COUPLE_GAP);
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. X 좌표 정규화 (최소 X를 BASE_X로)
  // ─────────────────────────────────────────────────────────────────────────
  let globalMinX = Infinity;
  for (const x of xPositions.values()) {
    globalMinX = Math.min(globalMinX, x);
  }
  for (const x of fetusXPositions.values()) {
    globalMinX = Math.min(globalMinX, x);
  }

  const xShift =
    globalMinX !== Infinity && globalMinX < BASE_X
      ? BASE_X - globalMinX
      : DEFAULT_COUPLE_OFFSET;

  // ─────────────────────────────────────────────────────────────────────────
  // 9. 결과 생성 (고아 노드는 제외)
  // ─────────────────────────────────────────────────────────────────────────
  const subjectsWithCoords: SubjectWithCoords[] = subjects
    .filter((s) => processedIds.has(s.id)) // 처리된 인물만 포함 (고아 노드 제외)
    .map((s) => {
      const x = snapToGrid((xPositions.get(s.id) ?? BASE_X) + xShift);
      const y = snapToGrid(yPositions.get(s.id) ?? BASE_Y);
      return { ...s, x, y };
    });

  const fetusesWithCoords: FetusWithCoords[] = fetusInfoList.map((f) => {
    const x = snapToGrid((fetusXPositions.get(f.id) ?? BASE_X) + xShift);
    const y = snapToGrid(
      fetusYPositions.get(f.id) ?? BASE_Y + Y_GENERATION_GAP
    );

    return {
      fatherId: f.fatherId,
      motherId: f.motherId,
      status: f.status,
      x,
      y,
    };
  });

  return { subjects: subjectsWithCoords, fetuses: fetusesWithCoords };
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 변환 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI 출력 JSON을 Canvas SerializedGenogram으로 변환
 * 인접 리스트(nuclearFamilies, siblingGroups)를 기반으로 좌표를 계산합니다.
 */
export function convertAIJsonToCanvas(
  aiOutput: AIGenogramOutput
): SerializedGenogram {
  // 좌표 계산
  const { subjects: subjectsWithCoords, fetuses: fetusesWithCoords } =
    calculateCoordinates(aiOutput);

  const now = new Date();
  const subjects: SerializedGenogram['subjects'] = [];
  const connections: SerializedGenogram['connections'] = [];

  // AI 숫자 ID → 실제 ID 매핑
  const idMap = new Map<number, string>();

  // PERSON subjects 처리
  for (const subject of subjectsWithCoords) {
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
            enable: !!(subject.job || subject.education || subject.region),
            job: subject.job ?? null,
            education: subject.education ?? null,
            region: subject.region ?? null,
          },
        },
        memo: subject.memo ?? null,
      },
      layout: {
        center: { x: subject.x, y: subject.y },
        style: {
          size: subject.size === 'SMALL' ? NodeSize.Small : NodeSize.Default,
          bgColor: DEFAULT_BG,
          textColor: DEFAULT_FG,
        },
      },
    });
  }

  // Fetus subjects 처리
  const fetusIdMap = new Map<string, string>();

  fetusesWithCoords.forEach((f, index) => {
    const key = `${f.fatherId}-${f.motherId}-${index}`;
    const realId = generateId('fetus');
    fetusIdMap.set(key, realId);

    subjects.push({
      id: realId,
      entity: {
        type: SubjectType.Fetus,
        attribute: {
          name: null,
          status: mapFetusStatus(f.status),
        },
        memo: f.status,
      },
      layout: {
        center: { x: f.x, y: f.y },
        style: {
          size: NodeSize.Small,
          bgColor: DEFAULT_BG,
          textColor: DEFAULT_FG,
        },
      },
    });
  });

  // Partner Lines 생성
  const partnerLineMap = new Map<string, string>();

  for (const [id1, id2, status] of aiOutput.partners) {
    const realId1 = idMap.get(id1);
    const realId2 = idMap.get(id2);

    if (!realId1 || !realId2) continue;

    const connectionId = generateId('partner');
    partnerLineMap.set(`${id1}-${id2}`, connectionId);
    partnerLineMap.set(`${id2}-${id1}`, connectionId);

    connections.push({
      id: connectionId,
      entity: {
        type: ConnectionType.Partner_Line,
        attribute: {
          status: mapPartnerStatus(status),
          subjects: [realId1, realId2],
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
  for (const [fatherId, motherId, childId, status] of aiOutput.children) {
    const realChildId = idMap.get(childId);
    if (!realChildId) continue;

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
  fetusesWithCoords.forEach((f, index) => {
    const key = `${f.fatherId}-${f.motherId}-${index}`;
    const realFetusId = fetusIdMap.get(key);
    if (!realFetusId) return;

    const key1 = `${f.fatherId}-${f.motherId}`;
    const key2 = `${f.motherId}-${f.fatherId}`;
    let parentRef = partnerLineMap.get(key1) ?? partnerLineMap.get(key2);

    if (!parentRef) {
      parentRef =
        (f.fatherId != null ? idMap.get(f.fatherId) : undefined) ??
        (f.motherId != null ? idMap.get(f.motherId) : undefined);
    }

    if (!parentRef) return;

    connections.push({
      id: generateId('parentchild'),
      entity: {
        type: ConnectionType.Children_Parents_Line,
        attribute: {
          status: mapFetusToChildStatus(f.status),
          parentRef,
          childRef: realFetusId,
        },
        memo: f.status,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  });

  // Relation Lines 생성
  for (const [id1, id2, description] of aiOutput.relations) {
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

  // Influence Lines 생성 (방향성 있는 관계)
  for (const [fromId, toId, status, memo] of aiOutput.influences) {
    const realFromId = idMap.get(fromId);
    const realToId = idMap.get(toId);

    if (!realFromId || !realToId) continue;

    connections.push({
      id: generateId('influence'),
      entity: {
        type: ConnectionType.Influence_Line,
        attribute: {
          status: mapInfluenceStatus(status),
          startRef: realFromId,
          endRef: realToId,
        },
        memo: memo ?? null,
      },
      layout: {
        strokeWidth: StrokeWidth.Default,
        strokeColor: DEFAULT_FG,
        textColor: DEFAULT_FG,
      },
    });
  }

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
        relationLine: false,
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

  // nuclearFamilies 배열 필수
  if (!Array.isArray(obj.nuclearFamilies)) return false;

  // 각 subject 검증 (x, y는 더 이상 필요 없음)
  for (const subject of obj.subjects) {
    if (typeof subject !== 'object' || subject === null) return false;
    const s = subject as Record<string, unknown>;
    if (typeof s.id !== 'number') return false;
  }

  return true;
}
