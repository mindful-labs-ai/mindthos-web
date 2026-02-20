import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import type {
  GroupMemberPosition,
  PartnerDetail,
} from '@/genogram/core/models/relationship';
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
  | 'engaged'
  | 'secret_affair'
  | 'remarriage';

export type AIChildStatus = 'biological' | 'adopted' | 'foster';

export type AIInfluenceStatus =
  | 'physical_abuse'
  | 'emotional_abuse'
  | 'sexual_abuse'
  | 'focused_on'
  | 'focused_on_negatively';

export type AIRelationStatus =
  | 'Connected'
  | 'Close'
  | 'Fused'
  | 'Distant'
  | 'Hostile'
  | 'Close_Hostile'
  | 'Fused_Hostile'
  | 'Cutoff'
  | 'Cutoff_Repaired';

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
  relations: [number, number, AIRelationStatus, string, number?][]; // [id1, id2, status, description, order?]
  influences: [number, number, AIInfluenceStatus, string?, number?][]; // [fromId, toId, status, memo?, order?]
  siblingGroups: AISiblingGroup[];
  nuclearFamilies: AINuclearFamily[];
}

/** 좌표가 계산된 Subject */
interface SubjectWithCoords extends AISubject {
  x: number;
  y: number;
}

/** Connection 스타일 및 상세 정보 (relationship.ts Connection 구조 반영) */
interface ConnectionInfo {
  // layout 필드 (ConnectionLayout)
  strokeWidth?: (typeof StrokeWidth)[keyof typeof StrokeWidth];
  strokeColor?: string;
  textColor?: string;
  // entity.memo
  memo?: string | null;
  // Partner Line 전용 (PartnerAttribute.detail)
  partnerDetail?: PartnerDetail;
  // Group Line 전용 (GroupAttribute)
  groupMemberIds?: string[];
  groupMemberPositions?: GroupMemberPosition[];
}

/** Subject 스타일 정보 (person.ts SubjectStyle + extraInfo.shortNote 반영) */
interface SubjectStyleInfo {
  x: number;
  y: number;
  // layout.style 필드 (SubjectStyle)
  size?: (typeof NodeSize)[keyof typeof NodeSize];
  bgColor?: string;
  textColor?: string;
  // entity.attribute.extraInfo.shortNote (PersonAttribute)
  shortNote?: string | null;
}

/** 기존 레이아웃 정보 (AI 재생성 시 좌표/스타일 유지용) */
export interface ExistingPositions {
  /** AI subject ID → 좌표 및 스타일 */
  subjects: Map<number, SubjectStyleInfo>;
  /** Connection key → 스타일 및 상세 정보 */
  connections?: Map<string, ConnectionInfo>;
  /** Group Line 데이터 (Canvas ID 기준, AI JSON에 없는 데이터) */
  groupLines?: ConnectionInfo[];
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
    case 'secret_affair':
      return PartnerStatus.Secret_Affair;
    case 'remarriage':
      return PartnerStatus.Remarriage;
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

interface CalculateCoordinatesOptions {
  /** 기존 좌표 (있으면 해당 좌표 사용, 없으면 자동 계산) */
  existingPositions?: ExistingPositions;
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
function calculateCoordinates(
  aiOutput: AIGenogramOutput,
  options: CalculateCoordinatesOptions = {}
): LayoutResult {
  const { existingPositions } = options;
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

  // IP가 여성이고 junction couple인 경우, 배우자 가족 전체(하위 트리 포함)를 앞으로
  if (ipIsFemale && ipId && ipSpouseId && junctionCouples.has(ipId)) {
    // 배우자가 속한 siblingGroup 찾기
    const spouseSiblingGroup = orderedSiblingGroups.find((sg) =>
      sg.siblingIds.includes(ipSpouseId)
    );

    if (spouseSiblingGroup) {
      // 배우자 가족의 모든 siblingGroup 찾기 (하위 트리 포함)
      const spouseFamilyMemberIds = new Set<number>(
        spouseSiblingGroup.siblingIds
      );
      const spouseFamilySiblingGroups = new Set<AISiblingGroup>();
      spouseFamilySiblingGroups.add(spouseSiblingGroup);

      // 배우자 siblingGroup 멤버들의 자손 siblingGroup 찾기
      const findDescendantSiblingGroups = (memberIds: number[]) => {
        for (const memberId of memberIds) {
          // memberId가 부모인 siblingGroup 찾기
          for (const sg of orderedSiblingGroups) {
            const [parentId1, parentId2] = sg.parentCoupleKey
              .split('-')
              .map(Number);
            // IP와의 공통 자녀는 제외 (IP가 부모인 경우)
            const isIPChild = parentId1 === ipId || parentId2 === ipId;
            if (
              !isIPChild &&
              (parentId1 === memberId || parentId2 === memberId)
            ) {
              if (!spouseFamilySiblingGroups.has(sg)) {
                spouseFamilySiblingGroups.add(sg);
                // 자손의 배우자도 가족으로 포함
                for (const childId of sg.siblingIds) {
                  spouseFamilyMemberIds.add(childId);
                  const childSpouseId = spouseMap.get(childId);
                  if (childSpouseId) {
                    spouseFamilyMemberIds.add(childSpouseId);
                  }
                }
                findDescendantSiblingGroups(sg.siblingIds);
              }
            }
          }
        }
      };

      findDescendantSiblingGroups(spouseSiblingGroup.siblingIds);

      // orderedSiblingGroups 재정렬:
      // 배우자 가족 siblingGroups를 앞으로, 나머지는 뒤로
      const spouseFamilyGroups = orderedSiblingGroups
        .filter((sg) => spouseFamilySiblingGroups.has(sg))
        .sort(
          (a, b) => getSiblingGroupGeneration(a) - getSiblingGroupGeneration(b)
        );
      const otherGroups = orderedSiblingGroups
        .filter((sg) => !spouseFamilySiblingGroups.has(sg))
        .sort(
          (a, b) => getSiblingGroupGeneration(a) - getSiblingGroupGeneration(b)
        );

      // 재정렬
      orderedSiblingGroups.length = 0;
      orderedSiblingGroups.push(...spouseFamilyGroups, ...otherGroups);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 좌표 보정 로직
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // 주의: 기존 로직은 수정하지 않고, 새로운 보정 단계를 추가하는 방식으로 개선합니다.
  // 각 단계는 독립적으로 작동하며, 이전 단계의 결과를 기반으로 보정합니다.
  //
  // ═══════════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 후처리: 부모 위치를 자녀 기준으로 조정
  // ─────────────────────────────────────────────────────────────────────────
  //
  // 순서:
  // 5-1. 일반 부부의 wrap adjustment (자녀 기준)
  // 5-2. Junction couple의 자녀 위치 조정 (부모의 최종 위치 기준)
  //

  // ─────────────────────────────────────────────────────────────────────────
  // 5-1. 일반 부부의 wrap adjustment (자녀 기준)
  // ─────────────────────────────────────────────────────────────────────────
  for (const nf of nuclearFamilies) {
    const { husbandId, wifeId, childrenIds } = nf;

    // 자녀가 없으면 스킵
    if (childrenIds.length === 0) continue;

    const isJunctionFamily =
      (husbandId && junctionCouples.has(husbandId)) ||
      (wifeId && junctionCouples.has(wifeId));

    // Junction couple은 5-3에서 처리
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
  // 5-2. Junction couple의 자녀 위치 조정 (부모의 최종 위치 기준)
  // ─────────────────────────────────────────────────────────────────────────
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

        // 부모들의 X 좌표 (충돌 방지용)
        const parentXSet = new Set<number>([husbandX, wifeX]);

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
          let childX = parentMidX + childOffset * X_SIBLING_GAP;

          // 부모 X좌표와 겹치면 오른쪽으로 이동
          while (parentXSet.has(childX)) {
            childX += X_SIBLING_GAP;
          }

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

  // ─────────────────────────────────────────────────────────────────────────
  // 6-1. 부부 X 좌표 검증 및 교환 (부 X > 모 X 이면 교환)
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
  // 6-2. 부부 영역 겹침 해결
  // ─────────────────────────────────────────────────────────────────────────
  // 부부1: H1 --- W1, 부부2: H2 --- W2
  // 겹침 상태: H1 < H2 < W1 < W2 → H1 < W1 < H2 < W2 로 재배치
  // 즉, 부부2를 부부1 오른쪽으로 이동
  const processedPairs = new Set<string>();

  for (const [p1Id1, p1Id2] of partners) {
    const p1Gen = generations.get(p1Id1) ?? DEFAULT_GENERATION;
    const p1X1 = xPositions.get(p1Id1);
    const p1X2 = xPositions.get(p1Id2);

    if (p1X1 === undefined || p1X2 === undefined) continue;

    const p1MinX = Math.min(p1X1, p1X2);
    const p1MaxX = Math.max(p1X1, p1X2);

    for (const [p2Id1, p2Id2] of partners) {
      // 같은 부부 스킵
      if (p1Id1 === p2Id1 || p1Id1 === p2Id2) continue;

      // 이미 처리된 쌍 스킵
      const pairKey = [p1Id1, p1Id2, p2Id1, p2Id2].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      // 다른 세대 스킵
      const p2Gen = generations.get(p2Id1) ?? DEFAULT_GENERATION;
      if (p1Gen !== p2Gen) continue;

      const p2X1 = xPositions.get(p2Id1);
      const p2X2 = xPositions.get(p2Id2);

      if (p2X1 === undefined || p2X2 === undefined) continue;

      const p2MinX = Math.min(p2X1, p2X2);
      const p2MaxX = Math.max(p2X1, p2X2);

      // 겹침 확인: 부부1 범위와 부부2 범위가 교차하는지
      // 케이스 1: p1MinX < p2MinX < p1MaxX < p2MaxX (부부2가 부부1에 끼어있음)
      if (p1MinX < p2MinX && p2MinX < p1MaxX && p1MaxX < p2MaxX) {
        // 부부2를 부부1 오른쪽으로 이동
        const offset = p1MaxX - p2MinX + MIN_COUPLE_GAP;
        xPositions.set(p2Id1, (p2X1 ?? 0) + offset);
        xPositions.set(p2Id2, (p2X2 ?? 0) + offset);
      }
      // 케이스 2: p2MinX < p1MinX < p2MaxX < p1MaxX (부부1이 부부2에 끼어있음)
      else if (p2MinX < p1MinX && p1MinX < p2MaxX && p2MaxX < p1MaxX) {
        // 부부1을 부부2 오른쪽으로 이동
        const offset = p2MaxX - p1MinX + MIN_COUPLE_GAP;
        xPositions.set(p1Id1, (p1X1 ?? 0) + offset);
        xPositions.set(p1Id2, (p1X2 ?? 0) + offset);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. 좌표 충돌 검사 및 이동 (파트너 좌표 기반)
  // ─────────────────────────────────────────────────────────────────────────
  //
  // 충돌 해결 전략:
  // 1. 파트너가 왼쪽에 있으면 → 왼쪽으로 이동 (-)
  // 2. 파트너가 오른쪽에 있으면 → 오른쪽으로 이동 (+)
  // 3. 파트너가 없으면 → 오른쪽으로 이동 (기본값)
  //
  // 세대(generation)별로 인물들을 그룹화 (Y 좌표가 아닌 세대로 그룹화)
  // Junction couple과 일반 형제는 같은 세대지만 Y가 다를 수 있음
  const positionsByGen = new Map<number, Map<number, number[]>>(); // gen -> (X -> [ids])

  for (const [id, x] of xPositions) {
    const gen = generations.get(id) ?? DEFAULT_GENERATION;

    if (!positionsByGen.has(gen)) {
      positionsByGen.set(gen, new Map());
    }
    const xMap = positionsByGen.get(gen)!;
    if (!xMap.has(x)) {
      xMap.set(x, []);
    }
    xMap.get(x)!.push(id);
  }

  // 이동 방향 결정 함수
  const getMovementDirection = (
    id: number,
    collisionX: number
  ): 'left' | 'right' => {
    const spouseId = spouseMap.get(id);
    if (!spouseId) return 'right'; // 파트너 없으면 기본 오른쪽

    const spouseX = xPositions.get(spouseId);
    if (spouseX === undefined) return 'right';

    // 파트너가 왼쪽에 있으면 왼쪽으로, 오른쪽에 있으면 오른쪽으로
    return spouseX < collisionX ? 'left' : 'right';
  };

  // 충돌하는 인물들 이동 (파트너 좌표 기반)
  for (const [_gen, xMap] of positionsByGen) {
    for (const [collisionX, ids] of xMap) {
      if (ids.length <= 1) continue;

      // 충돌 발생! 각 인물의 이동 방향 결정
      const leftMovers: number[] = []; // 왼쪽으로 이동할 인물들
      const rightMovers: number[] = []; // 오른쪽으로 이동할 인물들

      for (const id of ids) {
        const direction = getMovementDirection(id, collisionX);
        if (direction === 'left') {
          leftMovers.push(id);
        } else {
          rightMovers.push(id);
        }
      }

      // 왼쪽 이동 인물들 처리 (첫 번째는 제자리, 나머지는 왼쪽으로)
      leftMovers.forEach((id, index) => {
        if (index === 0) return; // 첫 번째는 제자리

        const offset = index * MIN_COUPLE_GAP;
        const newX = collisionX - offset;
        xPositions.set(id, newX);

        // 배우자도 함께 이동
        const spouseId = spouseMap.get(id);
        if (spouseId) {
          const spouseX = xPositions.get(spouseId);
          if (spouseX !== undefined) {
            xPositions.set(spouseId, spouseX - offset);
          }
        }
      });

      // 오른쪽 이동 인물들 처리
      // 왼쪽 이동자가 있으면 첫 번째 오른쪽 이동자는 제자리
      const rightStartIndex = leftMovers.length > 0 ? 0 : 1;
      rightMovers.forEach((id, index) => {
        if (index < rightStartIndex) return;

        const offset = (index - rightStartIndex + 1) * MIN_COUPLE_GAP;
        const newX = collisionX + offset;
        xPositions.set(id, newX);

        // 배우자도 함께 이동
        const spouseId = spouseMap.get(id);
        if (spouseId) {
          const spouseX = xPositions.get(spouseId);
          if (spouseX !== undefined) {
            xPositions.set(spouseId, spouseX + offset);
          }
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. 새 형제의 위치 조정 (기존 형제들 우측에 배치)
  // ─────────────────────────────────────────────────────────────────────────
  if (existingPositions && existingPositions.subjects.size > 0) {
    for (const sibGroup of siblingGroups) {
      const siblings = sibGroup.siblingIds;
      if (siblings.length <= 1) continue;

      // 기존 위치가 있는 형제와 새 형제 분리
      const existingSiblings = siblings.filter((id) =>
        existingPositions.subjects.has(id)
      );
      const newSiblings = siblings.filter(
        (id) => !existingPositions.subjects.has(id)
      );

      if (existingSiblings.length > 0 && newSiblings.length > 0) {
        // 기존 형제들 중 최우측 X 좌표 및 Y 좌표 찾기
        let maxX = -Infinity;
        let siblingY: number | undefined;
        for (const id of existingSiblings) {
          const pos = existingPositions.subjects.get(id);
          if (pos) {
            if (pos.x > maxX) maxX = pos.x;
            if (siblingY === undefined) siblingY = pos.y;
          }
        }

        // 새 형제들을 기존 형제들의 우측에 배치 (Y 좌표도 동일하게)
        let newX = maxX + X_SIBLING_GAP;
        for (const id of newSiblings) {
          xPositions.set(id, newX);
          if (siblingY !== undefined) {
            yPositions.set(id, siblingY);
          }
          newX += X_SIBLING_GAP;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. 결과 생성 (고아 노드도 별도 영역에 포함)
  // ─────────────────────────────────────────────────────────────────────────

  // 처리된 노드들의 좌표 계산
  const processedSubjects: SubjectWithCoords[] = subjects
    .filter((s) => processedIds.has(s.id))
    .map((s) => {
      const existingPos = existingPositions?.subjects.get(s.id);
      const x = existingPos?.x ?? snapToGrid(xPositions.get(s.id) ?? BASE_X);
      const y = existingPos?.y ?? snapToGrid(yPositions.get(s.id) ?? BASE_Y);
      return { ...s, x, y };
    });

  // 고아 노드 처리 (가족 구조에 포함되지 않은 인물)
  const orphanSubjects = subjects.filter((s) => !processedIds.has(s.id));

  // 고아 노드가 있으면 오른쪽 별도 영역에 배치
  const orphanSubjectsWithCoords: SubjectWithCoords[] = [];
  if (orphanSubjects.length > 0) {
    // 처리된 노드들의 최대 X 좌표 찾기
    let maxProcessedX = BASE_X;
    for (const s of processedSubjects) {
      if (s.x > maxProcessedX) maxProcessedX = s.x;
    }

    // 고아 노드 영역 시작 X (기존 영역에서 간격 추가)
    const ORPHAN_AREA_GAP = 180; // 고아 영역과 기존 영역 사이 간격
    const orphanStartX = snapToGrid(maxProcessedX + ORPHAN_AREA_GAP);
    const orphanY = BASE_Y; // 최상단에 배치

    // 고아 노드들을 가로로 배치
    orphanSubjects.forEach((s, index) => {
      // 기존 좌표가 있으면 사용 (사용자가 이동한 경우 유지)
      const existingPos = existingPositions?.subjects.get(s.id);
      const x =
        existingPos?.x ?? snapToGrid(orphanStartX + index * X_SIBLING_GAP);
      const y = existingPos?.y ?? snapToGrid(orphanY);
      orphanSubjectsWithCoords.push({ ...s, x, y });
    });
  }

  // 처리된 노드 + 고아 노드 합치기
  const subjectsWithCoords: SubjectWithCoords[] = [
    ...processedSubjects,
    ...orphanSubjectsWithCoords,
  ];

  const fetusesWithCoords: FetusWithCoords[] = fetusInfoList.map((f) => {
    const x = snapToGrid(fetusXPositions.get(f.id) ?? BASE_X);
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

export interface ConvertOptions {
  /** 기존 좌표 (있으면 해당 좌표 유지, 새 노드만 자동 배치) */
  existingPositions?: ExistingPositions;
}

/**
 * AI 출력 JSON을 Canvas SerializedGenogram으로 변환
 * 인접 리스트(nuclearFamilies, siblingGroups)를 기반으로 좌표를 계산합니다.
 *
 * @param aiOutput AI가 생성한 가계도 데이터
 * @param options 변환 옵션 (기존 좌표 유지 등)
 */
export function convertAIJsonToCanvas(
  aiOutput: AIGenogramOutput,
  options: ConvertOptions = {}
): SerializedGenogram {
  // siblingGroups와 nuclearFamilies를 children 배열로부터 재생성
  // (FamilyCard UI에서 children만 수정되고 siblingGroups/nuclearFamilies가 업데이트되지 않는 문제 해결)
  const { nuclearFamilies, siblingGroups } = buildFamilyStructures(
    aiOutput.subjects,
    aiOutput.partners,
    aiOutput.children
  );

  // 재생성된 데이터로 AI output 업데이트
  const normalizedAiOutput: AIGenogramOutput = {
    ...aiOutput,
    nuclearFamilies,
    siblingGroups,
  };

  // 좌표 계산 (기존 좌표가 있으면 유지)
  const { subjects: subjectsWithCoords, fetuses: fetusesWithCoords } =
    calculateCoordinates(normalizedAiOutput, {
      existingPositions: options.existingPositions,
    });

  const now = new Date();
  const subjects: SerializedGenogram['subjects'] = [];
  const connections: SerializedGenogram['connections'] = [];

  // AI 숫자 ID → 실제 ID 매핑
  const idMap = new Map<number, string>();

  // 기존 스타일 정보 조회 헬퍼
  const existingPositions = options.existingPositions;

  // PERSON subjects 처리
  for (const subject of subjectsWithCoords) {
    const realId = generateId('person');
    idMap.set(subject.id, realId);

    // 기존 스타일 정보 가져오기
    const existingStyle = existingPositions?.subjects.get(subject.id);

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
            enable: !!(
              subject.job ||
              subject.education ||
              subject.region ||
              existingStyle?.shortNote
            ),
            job: subject.job ?? null,
            education: subject.education ?? null,
            region: subject.region ?? null,
            shortNote: existingStyle?.shortNote ?? null,
          },
        },
        memo: subject.memo ?? null,
      },
      layout: {
        center: { x: subject.x, y: subject.y },
        style: {
          size:
            (existingStyle?.size as (typeof NodeSize)[keyof typeof NodeSize]) ??
            (subject.size === 'SMALL' ? NodeSize.Small : NodeSize.Default),
          bgColor: existingStyle?.bgColor ?? DEFAULT_BG,
          textColor: existingStyle?.textColor ?? DEFAULT_FG,
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
  const existingConnections = existingPositions?.connections;

  for (const [id1, id2, status] of aiOutput.partners) {
    const realId1 = idMap.get(id1);
    const realId2 = idMap.get(id2);

    if (!realId1 || !realId2) continue;

    const connectionId = generateId('partner');
    partnerLineMap.set(`${id1}-${id2}`, connectionId);
    partnerLineMap.set(`${id2}-${id1}`, connectionId);

    // 기존 스타일 정보 가져오기
    const existingStyle = existingConnections?.get(`partner-${id1}-${id2}`);

    connections.push({
      id: connectionId,
      entity: {
        type: ConnectionType.Partner_Line,
        attribute: {
          status: mapPartnerStatus(status),
          subjects: [realId1, realId2],
          detail: {
            marriedDate: existingStyle?.partnerDetail?.marriedDate ?? null,
            divorcedDate: existingStyle?.partnerDetail?.divorcedDate ?? null,
            reunitedDate: existingStyle?.partnerDetail?.reunitedDate ?? null,
            relationshipStartDate:
              existingStyle?.partnerDetail?.relationshipStartDate ?? null,
          },
        },
        memo: existingStyle?.memo ?? null,
      },
      layout: {
        strokeWidth:
          (existingStyle?.strokeWidth as (typeof StrokeWidth)[keyof typeof StrokeWidth]) ??
          StrokeWidth.Default,
        strokeColor: existingStyle?.strokeColor ?? DEFAULT_FG,
        textColor: existingStyle?.textColor ?? DEFAULT_FG,
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

    // 기존 스타일 정보 가져오기
    const existingStyle = existingConnections?.get(`children-${childId}`);

    connections.push({
      id: generateId('parentchild'),
      entity: {
        type: ConnectionType.Children_Parents_Line,
        attribute: {
          status: mapChildStatus(status),
          parentRef,
          childRef: realChildId,
        },
        memo: existingStyle?.memo ?? null,
      },
      layout: {
        strokeWidth:
          (existingStyle?.strokeWidth as (typeof StrokeWidth)[keyof typeof StrokeWidth]) ??
          StrokeWidth.Default,
        strokeColor: existingStyle?.strokeColor ?? DEFAULT_FG,
        textColor: existingStyle?.textColor ?? DEFAULT_FG,
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
  for (const [id1, id2, status, description] of aiOutput.relations) {
    const realId1 = idMap.get(id1);
    const realId2 = idMap.get(id2);

    if (!realId1 || !realId2) continue;

    // 기존 스타일 정보 가져오기
    const existingStyle = existingConnections?.get(`relation-${id1}-${id2}`);

    connections.push({
      id: generateId('relation'),
      entity: {
        type: ConnectionType.Relation_Line,
        attribute: {
          status:
            RelationStatus[status as keyof typeof RelationStatus] ||
            RelationStatus.Connected,
          subjects: [realId1, realId2],
        },
        memo: existingStyle?.memo ?? description,
      },
      layout: {
        strokeWidth:
          (existingStyle?.strokeWidth as (typeof StrokeWidth)[keyof typeof StrokeWidth]) ??
          StrokeWidth.Default,
        strokeColor: existingStyle?.strokeColor ?? DEFAULT_FG,
        textColor: existingStyle?.textColor ?? DEFAULT_FG,
      },
    });
  }

  // Influence Lines 생성 (방향성 있는 관계)
  for (const [fromId, toId, status, aiMemo] of aiOutput.influences) {
    const realFromId = idMap.get(fromId);
    const realToId = idMap.get(toId);

    if (!realFromId || !realToId) continue;

    // 기존 스타일 정보 가져오기
    const existingStyle = existingConnections?.get(`influence-${fromId}-${toId}`);

    connections.push({
      id: generateId('influence'),
      entity: {
        type: ConnectionType.Influence_Line,
        attribute: {
          status: mapInfluenceStatus(status),
          startRef: realFromId,
          endRef: realToId,
        },
        memo: existingStyle?.memo ?? aiMemo ?? null,
      },
      layout: {
        strokeWidth:
          (existingStyle?.strokeWidth as (typeof StrokeWidth)[keyof typeof StrokeWidth]) ??
          StrokeWidth.Default,
        strokeColor: existingStyle?.strokeColor ?? DEFAULT_FG,
        textColor: existingStyle?.textColor ?? DEFAULT_FG,
      },
    });
  }

  // Group Lines 복원 (AI JSON에 없는 데이터이므로 기존 캔버스에서 복원)
  // Group Line의 memberIds는 Canvas ID 기준이므로, 새로운 ID로 매핑 필요
  // 현재는 AI ID → Canvas ID 매핑이 없으므로, 그대로 보존 (name 기반 매핑 고려 가능)
  if (existingPositions?.groupLines) {
    for (const groupInfo of existingPositions.groupLines) {
      // memberIds가 없으면 건너뜀
      if (
        !groupInfo.groupMemberIds ||
        groupInfo.groupMemberIds.length === 0 ||
        !groupInfo.groupMemberPositions
      ) {
        continue;
      }

      connections.push({
        id: generateId('group'),
        entity: {
          type: ConnectionType.Group_Line,
          attribute: {
            memberIds: groupInfo.groupMemberIds,
            memberPositions: groupInfo.groupMemberPositions,
          },
          memo: groupInfo.memo ?? null,
        },
        layout: {
          strokeWidth:
            (groupInfo.strokeWidth as (typeof StrokeWidth)[keyof typeof StrokeWidth]) ??
            StrokeWidth.Default,
          strokeColor: groupInfo.strokeColor ?? DEFAULT_FG,
          textColor: groupInfo.textColor ?? DEFAULT_FG,
        },
      });
    }
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

/**
 * Canvas 데이터에서 AI JSON ID 기반 좌표 맵 추출
 *
 * @param canvas 기존 Canvas 데이터
 * @param aiOutput 새로운 AI JSON (ID 매칭용)
 * @returns 기존 좌표 맵 (AI subject ID → 좌표)
 *
 * 매칭 우선순위:
 * 1. name + gender 일치
 * 2. name 일치
 * 3. isIP 일치 (내담자)
 */
export function extractPositionsFromCanvas(
  canvas: SerializedGenogram,
  aiOutput: AIGenogramOutput
): ExistingPositions {
  const positions: ExistingPositions = {
    subjects: new Map(),
  };

  // Canvas subject 레이아웃 정보 타입
  interface CanvasSubjectInfo {
    id: string;
    x: number;
    y: number;
    isIP: boolean;
    size?: (typeof NodeSize)[keyof typeof NodeSize];
    bgColor?: string;
    textColor?: string;
    shortNote?: string | null;
  }

  // Canvas subject를 name + gender로 인덱싱
  const canvasSubjectsByNameGender = new Map<string, CanvasSubjectInfo>();
  const canvasSubjectsByName = new Map<string, CanvasSubjectInfo>();
  // 이름 없는 캔버스 노드를 순서(인덱스)로 인덱싱
  const unnamedCanvasSubjects: CanvasSubjectInfo[] = [];
  let canvasIP: CanvasSubjectInfo | null = null;

  let canvasIndex = 0;
  for (const subject of canvas.subjects) {
    if (subject.entity.type !== SubjectType.Person) continue;
    canvasIndex++;

    const attr = subject.entity.attribute as {
      name?: string | null;
      gender?: string;
      isIP?: boolean;
      extraInfo?: { shortNote?: string | null };
    };
    const name = attr.name?.trim();
    const gender = attr.gender;
    const isIP = attr.isIP ?? false;
    const style = subject.layout.style as {
      size?: (typeof NodeSize)[keyof typeof NodeSize];
      bgColor?: string;
      textColor?: string;
    };
    const pos: CanvasSubjectInfo = {
      id: subject.id,
      x: subject.layout.center.x,
      y: subject.layout.center.y,
      isIP,
      size: style?.size,
      bgColor: style?.bgColor,
      textColor: style?.textColor,
      shortNote: attr.extraInfo?.shortNote,
    };

    if (name && gender) {
      canvasSubjectsByNameGender.set(`${name}-${gender}`, pos);
    }
    if (name) {
      canvasSubjectsByName.set(name, pos);
    } else {
      // 이름 없는 노드: "인물 {canvasIndex}" 키로도 저장
      canvasSubjectsByName.set(`인물 ${canvasIndex}`, pos);
      unnamedCanvasSubjects.push(pos);
    }
    if (isIP) {
      canvasIP = pos;
    }
  }

  // 매칭된 캔버스 노드 ID 추적 (중복 매칭 방지)
  const matchedCanvasIds = new Set<string>();

  // AI subject와 매칭
  for (const aiSubject of aiOutput.subjects) {
    const name = aiSubject.name?.trim();
    const gender = aiSubject.gender;

    // 1. name + gender 일치
    if (name && gender) {
      const match = canvasSubjectsByNameGender.get(`${name}-${gender}`);
      if (match && !matchedCanvasIds.has(match.id)) {
        matchedCanvasIds.add(match.id);
        positions.subjects.set(aiSubject.id, {
          x: match.x,
          y: match.y,
          size: match.size,
          bgColor: match.bgColor,
          textColor: match.textColor,
          shortNote: match.shortNote,
        });
        continue;
      }
    }

    // 2. name 일치 (이름 없는 노드의 "인물 n" 키도 포함)
    if (name) {
      const match = canvasSubjectsByName.get(name);
      if (match && !matchedCanvasIds.has(match.id)) {
        matchedCanvasIds.add(match.id);
        positions.subjects.set(aiSubject.id, {
          x: match.x,
          y: match.y,
          size: match.size,
          bgColor: match.bgColor,
          textColor: match.textColor,
          shortNote: match.shortNote,
        });
        continue;
      }
    }

    // 3. isIP 일치
    if (aiSubject.isIP && canvasIP && !matchedCanvasIds.has(canvasIP.id)) {
      matchedCanvasIds.add(canvasIP.id);
      positions.subjects.set(aiSubject.id, {
        x: canvasIP.x,
        y: canvasIP.y,
        size: canvasIP.size,
        bgColor: canvasIP.bgColor,
        textColor: canvasIP.textColor,
        shortNote: canvasIP.shortNote,
      });
      continue;
    }

    // 4. 이름 없는 캔버스 노드와 순차 매칭 (아직 매칭 안 된 것 중 첫 번째)
    const unmatchedUnnamed = unnamedCanvasSubjects.find(
      (u) => !matchedCanvasIds.has(u.id)
    );
    if (unmatchedUnnamed) {
      matchedCanvasIds.add(unmatchedUnnamed.id);
      positions.subjects.set(aiSubject.id, {
        x: unmatchedUnnamed.x,
        y: unmatchedUnnamed.y,
        size: unmatchedUnnamed.size,
        bgColor: unmatchedUnnamed.bgColor,
        textColor: unmatchedUnnamed.textColor,
        shortNote: unmatchedUnnamed.shortNote,
      });
    }
  }

  // Connection 스타일 추출
  positions.connections = new Map();

  // Canvas ID → AI ID 역매핑 (매칭된 subject 기준)
  const canvasIdToAiId = new Map<string, number>();
  for (const [aiId, info] of positions.subjects) {
    // 매칭된 canvas subject 찾기
    for (const subject of canvas.subjects) {
      if (
        subject.layout.center.x === info.x &&
        subject.layout.center.y === info.y
      ) {
        canvasIdToAiId.set(subject.id, aiId);
        break;
      }
    }
  }

  for (const connection of canvas.connections) {
    const layout = connection.layout as {
      strokeWidth?: (typeof StrokeWidth)[keyof typeof StrokeWidth];
      strokeColor?: string;
      textColor?: string;
    };

    if (connection.entity.type === ConnectionType.Partner_Line) {
      const attr = connection.entity.attribute as {
        subjects?: string[];
        detail?: PartnerDetail;
      };
      const subjectIds = attr.subjects ?? [];
      if (subjectIds.length === 2) {
        const aiId1 = canvasIdToAiId.get(subjectIds[0]);
        const aiId2 = canvasIdToAiId.get(subjectIds[1]);
        if (aiId1 !== undefined && aiId2 !== undefined) {
          const connectionInfo: ConnectionInfo = {
            strokeWidth: layout?.strokeWidth,
            strokeColor: layout?.strokeColor,
            textColor: layout?.textColor,
            memo: connection.entity.memo,
            partnerDetail: attr.detail,
          };
          // 양방향 키 저장
          positions.connections.set(`partner-${aiId1}-${aiId2}`, connectionInfo);
          positions.connections.set(`partner-${aiId2}-${aiId1}`, connectionInfo);
        }
      }
    } else if (
      connection.entity.type === ConnectionType.Children_Parents_Line
    ) {
      const attr = connection.entity.attribute as {
        childRef?: string;
      };
      const childAiId = attr.childRef
        ? canvasIdToAiId.get(attr.childRef)
        : undefined;
      if (childAiId !== undefined) {
        positions.connections.set(`children-${childAiId}`, {
          strokeWidth: layout?.strokeWidth,
          strokeColor: layout?.strokeColor,
          textColor: layout?.textColor,
          memo: connection.entity.memo,
        });
      }
    } else if (connection.entity.type === ConnectionType.Relation_Line) {
      const attr = connection.entity.attribute as { subjects?: string[] };
      const subjectIds = attr.subjects ?? [];
      if (subjectIds.length === 2) {
        const aiId1 = canvasIdToAiId.get(subjectIds[0]);
        const aiId2 = canvasIdToAiId.get(subjectIds[1]);
        if (aiId1 !== undefined && aiId2 !== undefined) {
          const connectionInfo: ConnectionInfo = {
            strokeWidth: layout?.strokeWidth,
            strokeColor: layout?.strokeColor,
            textColor: layout?.textColor,
            memo: connection.entity.memo,
          };
          positions.connections.set(`relation-${aiId1}-${aiId2}`, connectionInfo);
          positions.connections.set(`relation-${aiId2}-${aiId1}`, connectionInfo);
        }
      }
    } else if (connection.entity.type === ConnectionType.Influence_Line) {
      const attr = connection.entity.attribute as {
        startRef?: string;
        endRef?: string;
      };
      const fromAiId = attr.startRef
        ? canvasIdToAiId.get(attr.startRef)
        : undefined;
      const toAiId = attr.endRef ? canvasIdToAiId.get(attr.endRef) : undefined;
      if (fromAiId !== undefined && toAiId !== undefined) {
        positions.connections.set(`influence-${fromAiId}-${toAiId}`, {
          strokeWidth: layout?.strokeWidth,
          strokeColor: layout?.strokeColor,
          textColor: layout?.textColor,
          memo: connection.entity.memo,
        });
      }
    } else if (connection.entity.type === ConnectionType.Group_Line) {
      // Group Line은 AI JSON에 없으므로 별도 배열에 저장
      const attr = connection.entity.attribute as {
        memberIds?: string[];
        memberPositions?: GroupMemberPosition[];
      };
      if (!positions.groupLines) {
        positions.groupLines = [];
      }
      positions.groupLines.push({
        strokeWidth: layout?.strokeWidth,
        strokeColor: layout?.strokeColor,
        textColor: layout?.textColor,
        memo: connection.entity.memo,
        groupMemberIds: attr.memberIds,
        groupMemberPositions: attr.memberPositions,
      });
    }
  }

  return positions;
}

// ─────────────────────────────────────────────────────────────────────────────
// 역변환 함수 (Canvas → AI JSON)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canvas SerializedGenogram을 AI JSON 형식으로 역변환
 *
 * @param canvas Canvas 데이터
 * @returns AI JSON 형식 데이터
 *
 * 주의: 일부 정보는 손실될 수 있음:
 * - Sibling_Line (AI JSON에 없음)
 * - 일부 세부 스타일 정보
 */
export function convertCanvasToAIJson(
  canvas: SerializedGenogram
): AIGenogramOutput {
  const subjects: AISubject[] = [];
  const partners: AIGenogramOutput['partners'] = [];
  const children: AIGenogramOutput['children'] = [];
  const fetus: AIGenogramOutput['fetus'] = [];
  const relations: AIGenogramOutput['relations'] = [];
  const influences: AIGenogramOutput['influences'] = [];

  // Canvas ID → AI ID 매핑
  const canvasToAiId = new Map<string, number>();
  let nextId = 1;

  // 1. Subjects 변환
  for (const subject of canvas.subjects) {
    if (subject.entity.type === SubjectType.Person) {
      const aiId = nextId++;
      canvasToAiId.set(subject.id, aiId);

      const attr = subject.entity.attribute as {
        gender?: string;
        name?: string | null;
        isIP?: boolean;
        isDead?: boolean;
        illness?: string;
        age?: number | null;
        lifeSpan?: { birth?: string | null; death?: string | null };
        extraInfo?: {
          job?: string | null;
          education?: string | null;
          region?: string | null;
        };
      };

      // 이름이 없으면 "인물 {aiId}" 할당 (고유 ID 기반)
      const name = attr.name?.trim() || `인물 ${aiId}`;

      subjects.push({
        id: aiId,
        type: 'PERSON',
        gender: attr.gender as AISubject['gender'],
        name,
        isIP: attr.isIP,
        isDead: attr.isDead,
        illness: attr.illness as AISubject['illness'],
        memo: subject.entity.memo ?? undefined,
        age: attr.age ?? undefined,
        birthYear: attr.lifeSpan?.birth
          ? parseInt(attr.lifeSpan.birth.substring(0, 4), 10)
          : undefined,
        deathYear: attr.lifeSpan?.death
          ? parseInt(attr.lifeSpan.death.substring(0, 4), 10)
          : undefined,
        job: attr.extraInfo?.job,
        education: attr.extraInfo?.education,
        region: attr.extraInfo?.region,
      });
    } else if (subject.entity.type === SubjectType.Fetus) {
      // Fetus는 children 변환 시 처리
    }
  }

  // 2. Connections 변환
  // Partner Line ID → [subject1, subject2] 매핑 (children 변환 시 사용)
  const partnerLineSubjects = new Map<string, [number, number]>();

  for (const connection of canvas.connections) {
    if (connection.entity.type === ConnectionType.Partner_Line) {
      const attr = connection.entity.attribute as {
        status?: string;
        subjects?: string[];
      };
      const subjectIds = attr.subjects ?? [];
      if (subjectIds.length === 2) {
        const aiId1 = canvasToAiId.get(subjectIds[0]);
        const aiId2 = canvasToAiId.get(subjectIds[1]);
        if (aiId1 && aiId2) {
          partners.push([
            aiId1,
            aiId2,
            reverseMapPartnerStatus(attr.status),
            connection.entity.memo ?? undefined,
          ]);
          partnerLineSubjects.set(connection.id, [aiId1, aiId2]);
        }
      }
    } else if (
      connection.entity.type === ConnectionType.Children_Parents_Line
    ) {
      const attr = connection.entity.attribute as {
        status?: string;
        parentRef?: string;
        childRef?: string;
      };

      const childAiId = attr.childRef
        ? canvasToAiId.get(attr.childRef)
        : undefined;

      // parentRef가 Partner Line ID인지 Subject ID인지 확인
      let fatherId: number | null = null;
      let motherId: number | null = null;

      if (attr.parentRef) {
        const partnerSubjects = partnerLineSubjects.get(attr.parentRef);
        if (partnerSubjects) {
          // Partner Line 참조
          const [id1, id2] = partnerSubjects;
          const s1 = subjects.find((s) => s.id === id1);
          if (s1?.gender === 'Male' || s1?.gender === 'Female') {
            fatherId = s1.gender === 'Male' ? id1 : id2;
            motherId = s1.gender === 'Male' ? id2 : id1;
          } else {
            fatherId = id1;
            motherId = id2;
          }
        } else {
          // 단일 부모 참조
          const parentAiId = canvasToAiId.get(attr.parentRef);
          if (parentAiId) {
            const parent = subjects.find((s) => s.id === parentAiId);
            if (parent?.gender === 'Male') {
              fatherId = parentAiId;
            } else {
              motherId = parentAiId;
            }
          }
        }
      }

      // Fetus인지 확인
      const childSubject = canvas.subjects.find((s) => s.id === attr.childRef);
      if (childSubject?.entity.type === SubjectType.Fetus) {
        const fetusAttr = childSubject.entity.attribute as { status?: string };
        fetus.push([fatherId, motherId, fetusAttr.status ?? 'pregnancy']);
      } else if (childAiId) {
        children.push([
          fatherId,
          motherId,
          childAiId,
          reverseMapChildStatus(attr.status),
          connection.entity.memo ?? undefined,
        ]);
      }
    } else if (connection.entity.type === ConnectionType.Relation_Line) {
      const attr = connection.entity.attribute as {
        status?: string;
        subjects?: string[];
      };
      const subjectIds = attr.subjects ?? [];
      if (subjectIds.length === 2) {
        const aiId1 = canvasToAiId.get(subjectIds[0]);
        const aiId2 = canvasToAiId.get(subjectIds[1]);
        if (aiId1 && aiId2) {
          relations.push([
            aiId1,
            aiId2,
            (attr.status as AIRelationStatus) ?? 'Connected',
            connection.entity.memo ?? '',
          ]);
        }
      }
    } else if (connection.entity.type === ConnectionType.Influence_Line) {
      const attr = connection.entity.attribute as {
        status?: string;
        startRef?: string;
        endRef?: string;
      };
      const fromAiId = attr.startRef
        ? canvasToAiId.get(attr.startRef)
        : undefined;
      const toAiId = attr.endRef ? canvasToAiId.get(attr.endRef) : undefined;
      if (fromAiId && toAiId) {
        influences.push([
          fromAiId,
          toAiId,
          reverseMapInfluenceStatus(attr.status),
          connection.entity.memo ?? undefined,
        ]);
      }
    }
  }

  // 3. nuclearFamilies 및 siblingGroups 생성
  const { nuclearFamilies, siblingGroups } = buildFamilyStructures(
    subjects,
    partners,
    children
  );

  return {
    subjects,
    partners,
    children,
    fetus,
    relations,
    influences,
    siblingGroups,
    nuclearFamilies,
  };
}

// 역변환 헬퍼 함수들
function reverseMapPartnerStatus(status?: string): AIPartnerStatus | undefined {
  switch (status) {
    case PartnerStatus.Divorce:
      return 'divorced';
    case PartnerStatus.Marital_Separation:
      return 'separated';
    case PartnerStatus.Couple_Relationship:
      return 'cohabiting';
    case PartnerStatus.Secret_Affair:
      return 'secret_affair';
    case PartnerStatus.Remarriage:
      return 'remarriage';
    case PartnerStatus.Marriage:
    default:
      return 'marriage';
  }
}

function reverseMapChildStatus(status?: string): AIChildStatus | undefined {
  switch (status) {
    case ParentChildStatus.Adopted_Child:
      return 'adopted';
    case ParentChildStatus.Foster_Child:
      return 'foster';
    default:
      return 'biological';
  }
}

function reverseMapInfluenceStatus(status?: string): AIInfluenceStatus {
  switch (status) {
    case InfluenceStatus.Physical_Abuse:
      return 'physical_abuse';
    case InfluenceStatus.Emotional_Abuse:
      return 'emotional_abuse';
    case InfluenceStatus.Sexual_Abuse:
      return 'sexual_abuse';
    case InfluenceStatus.Focused_On_Negatively:
      return 'focused_on_negatively';
    case InfluenceStatus.Focused_On:
    default:
      return 'focused_on';
  }
}

/**
 * subjects, partners, children으로부터 nuclearFamilies와 siblingGroups 생성
 */
function buildFamilyStructures(
  subjects: AISubject[],
  partners: AIGenogramOutput['partners'],
  children: AIGenogramOutput['children']
): { nuclearFamilies: AINuclearFamily[]; siblingGroups: AISiblingGroup[] } {
  const nuclearFamilies: AINuclearFamily[] = [];
  const siblingGroups: AISiblingGroup[] = [];

  // 부부별 자녀 그룹화
  const coupleChildrenMap = new Map<string, number[]>();

  for (const [fatherId, motherId, childId] of children) {
    const key = `${fatherId ?? 'null'}-${motherId ?? 'null'}`;
    if (!coupleChildrenMap.has(key)) {
      coupleChildrenMap.set(key, []);
    }
    coupleChildrenMap.get(key)!.push(childId);
  }

  // IP 찾기
  const ipSubject = subjects.find((s) => s.isIP);
  const ipGeneration = 0;

  // 간단한 세대 추론 (IP 기준)
  const generations = new Map<number, number>();
  if (ipSubject) {
    generations.set(ipSubject.id, ipGeneration);

    // IP의 배우자도 같은 세대
    for (const [id1, id2] of partners) {
      if (id1 === ipSubject.id) generations.set(id2, ipGeneration);
      if (id2 === ipSubject.id) generations.set(id1, ipGeneration);
    }
  }

  // 부모-자녀 관계로 세대 전파
  let changed = true;
  while (changed) {
    changed = false;
    for (const [fatherId, motherId, childId] of children) {
      const parentGen =
        (fatherId ? generations.get(fatherId) : undefined) ??
        (motherId ? generations.get(motherId) : undefined);

      if (parentGen !== undefined && !generations.has(childId)) {
        generations.set(childId, parentGen + 1);
        changed = true;
      }

      if (parentGen === undefined) {
        const childGen = generations.get(childId);
        if (childGen !== undefined) {
          if (fatherId && !generations.has(fatherId)) {
            generations.set(fatherId, childGen - 1);
            changed = true;
          }
          if (motherId && !generations.has(motherId)) {
            generations.set(motherId, childGen - 1);
            changed = true;
          }
        }
      }
    }

    // 배우자 세대 동기화
    for (const [id1, id2] of partners) {
      const gen1 = generations.get(id1);
      const gen2 = generations.get(id2);
      if (gen1 !== undefined && gen2 === undefined) {
        generations.set(id2, gen1);
        changed = true;
      }
      if (gen2 !== undefined && gen1 === undefined) {
        generations.set(id1, gen2);
        changed = true;
      }
    }
  }

  // NuclearFamilies 생성
  for (const [coupleKey, childrenIds] of coupleChildrenMap) {
    const [fatherStr, motherStr] = coupleKey.split('-');
    const fatherId = fatherStr !== 'null' ? parseInt(fatherStr, 10) : null;
    const motherId = motherStr !== 'null' ? parseInt(motherStr, 10) : null;

    const parentGen =
      (fatherId ? generations.get(fatherId) : undefined) ??
      (motherId ? generations.get(motherId) : undefined) ??
      0;

    nuclearFamilies.push({
      husbandId: fatherId,
      wifeId: motherId,
      childrenIds,
      generation: parentGen,
    });

    // SiblingGroups 생성
    if (childrenIds.length > 0) {
      siblingGroups.push({
        parentCoupleKey: `${fatherId ?? 'null'}-${motherId ?? 'null'}`,
        siblingIds: childrenIds,
      });
    }
  }

  return { nuclearFamilies, siblingGroups };
}
