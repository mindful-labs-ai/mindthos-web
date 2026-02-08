/**
 * generate-family-summary API
 *
 * 이 파일은 Vercel API Route로 구현된 가계도 AI 분석 파이프라인입니다.
 * AI가 축어록을 분석하여 가족 구조 데이터를 JSON으로 반환합니다.
 * 좌표 계산 및 캔버스 변환은 프론트엔드(aiJsonConverter.ts)에서 처리합니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// ─────────────────────────────────────────────────────────────────────────────
// 환경 변수
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_WEBAPP_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_WEBAPP_SUPABASE_ANON_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({ apiKey: openaiApiKey });

function createSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 프롬프트 정의 (좌표 없음, 인접 리스트 추가)
// ─────────────────────────────────────────────────────────────────────────────

const GENOGRAM_JSON_PROMPT = `상담 축어록에서 가족 정보를 추출하여 가계도 구조 데이터를 생성하세요.

## 작업 순서
1. 축어록에서 언급된 모든 가족 구성원을 식별
2. 각 구성원의 관계(부모, 자녀, 배우자, 형제 등)를 파악
3. 인접 리스트(siblingGroups, nuclearFamilies) 생성
4. **반드시 siblingGroups와 nuclearFamilies 교차 검증 수행**
5. JSON 형식으로 출력

## 출력 형식
{
  "subjects": [
    {
      "id": 1,
      "type": "PERSON",
      "gender": "Male" | "Female" | "Gay" | "Lesbian" | "Transgender_Male" | "Transgender_Female" | "Nonbinary",
      "name": "이름/호칭",
      "isIP": true/false,
      "isDead": true/false,
      "illness": "None" | "Psychological_Or_Physical_Problem" | "Alcohol_Or_Drug_Abuse" | ...,
      "size": "DEFAULT" | "SMALL",
      "birthOrder": 숫자 (형제 중 출생 순서, 1=첫째),
      "spouseId": 배우자id (있는 경우),
      "birthYear": 출생년도 (있는 경우),
      "age": 나이 (있는 경우),
      "job": "직업" (있는 경우),
      "education": "학력" (있는 경우),
      "region": "지역" (있는 경우),
      "memo": "구조화할 수 없는 서술적 정보만"
    }
  ],
  "partners": [[id1, id2, "상태", "memo(선택)"]],
  "children": [[아버지id, 어머니id, 자녀id, "상태", "memo(선택)"]],
  "fetus": [[아버지id, 어머니id, "유산/임신/낙태"]],
  "relations": [[id1, id2, "관계설명"]],
  "influences": [[fromId, toId, "상태", "memo(선택)"]],
  "siblingGroups": [
    {
      "parentCoupleKey": "부id-모id",
      "siblingIds": [자녀id들, birthOrder순 정렬]
    }
  ],
  "nuclearFamilies": [
    {
      "husbandId": 남편id 또는 null,
      "wifeId": 아내id 또는 null,
      "childrenIds": [자녀id들, birthOrder순 정렬],
      "generation": 세대번호 (0=IP세대, -1=부모, -2=조부모, 1=자녀, 2=손자녀)
    }
  ]
}

## subjects 규칙
- **id**: 숫자 1부터 시작 (내담자는 반드시 id=1)
- **type**: "PERSON" 고정 (유산/임신/낙태는 fetus 배열에만 추가)
- **gender**: "Male", "Female", "Gay", "Lesbian", "Transgender_Male", "Transgender_Female", "Nonbinary" 중 하나
- **isIP**: 내담자(Identified Patient)만 true
- **isDead**: 사망자는 true
- **illness**: 심리적/신체적 문제가 언급된 경우:
  - "None" (기본값)
  - "Psychological_Or_Physical_Problem" (심리적/신체적 문제)
  - "Alcohol_Or_Drug_Abuse" (알코올/약물 남용)
  - "Suspected_Alcohol_Or_Drug_Abuse" (알코올/약물 남용 의심)
  - "Psychological_Or_Physical_Illness_In_Remission" (질병 관해)
  - "In_Recovery_From_Substance_Abuse" (물질 남용 회복 중)
  - "Serious_Mental_Or_Physical_Problems_And_Substance_Abuse" (심각한 문제 + 물질 남용)
- **size**:
  - "SMALL": 관계만 언급되고 구체적 정보가 없는 인물 (예: "형의 아내가 있다")
  - "DEFAULT": 구체적 정보(이름, 나이, 직업, 성격 등)가 있는 인물
- **birthOrder**: 형제 중 출생 순서 (1=첫째, 2=둘째...). 알 수 없으면 추정값 사용
- **spouseId**: 배우자가 있는 경우 배우자의 id

### 구조화된 속성 (memo에 넣지 말 것!)
- **birthYear**: 출생년도 (예: 2000, 1975)
- **age**: 나이 (숫자)
- **job**: 직업 (문자열)
- **education**: 학력 (문자열)
- **region**: 거주지역 (문자열)

### memo 규칙
memo에는 위 속성으로 분리할 수 없는 서술적 정보만:
- 성격, 행동 패턴, 관계 특성
- 중요한 생애 사건
- 상담에서 언급된 특이사항

### 관계만 언급된 인물 처리
배우자나 가족 존재만 언급되고 구체적 정보가 없는 경우:
- 반드시 subjects에 추가 (partners/children 연결 위해 필요)
- size: "SMALL"
- name: 관계로 표기 (예: "형의 아내", "첫째의 배우자")

### 임의 부모 생성 규칙 ⚠️ 매우 중요!
형제자매는 반드시 부모를 통해 연결해야 함:
- 형제자매끼리 직접 연결하지 않음
- 부모가 언급되지 않아도 임의의 부모 생성하여 children 배열로 연결
- 어머니만 언급된 경우 → 아버지도 생성 (size: "SMALL")
- 아버지만 언급된 경우 → 어머니도 생성 (size: "SMALL")

## partners 규칙
- 형식: [id1, id2, 상태, memo?]
- 상태: "marriage"(기본), "divorced", "separated", "cohabiting"
- 동성 커플: 둘 다 같은 성별이어도 등록 (나이순 또는 먼저 언급된 순)

## children 규칙 ⚠️ 매우 중요!
- 형식: [아버지id, 어머니id, 자녀id, 상태, memo?]
- 상태: "biological"(기본), "adopted", "foster"
- 자녀id는 birthOrder 순서대로 나열
- **모든 자녀는 반드시 children 배열에 포함해야 함**
- siblingGroups나 nuclearFamilies의 자녀와 children 배열은 완전히 일치해야 함
- 예: siblingGroups에 [1, 2, 3]이 있으면 children에도 1, 2, 3 모두 포함 필수

## fetus 규칙
- 형식: [아버지id, 어머니id, 상태설명]
- 상태설명: "유산", "임신", "낙태" 등

## relations 규칙 (최소화!)
- 형식: [id1, id2, 관계설명]
- 감정적 관계만: 친밀, 갈등, 소원, 적대, 단절 등
- 구조적 관계(형제, 부모, 자녀)는 포함하지 말 것
- ⚠️ **반복적으로 언급된 관계만 기록** (1회 언급은 무시)
- 축어록에서 여러 번 강조된 핵심 관계만 추출

## influences 규칙 (최소화!)
- 형식: [fromId, toId, 상태, memo?]
- fromId에서 toId 방향으로의 영향/행위를 나타냄
- 상태:
  - "physical_abuse": 신체적 학대
  - "emotional_abuse": 정서적 학대
  - "sexual_abuse": 성적 학대
  - "focused_on": 과도한 관심/집착 (긍정적 뉘앙스)
  - "focused_on_negatively": 부정적 집착/과잉 통제
- ⚠️ **반복적으로 언급된 경우만 기록** (1회 언급은 무시)
- 축어록에서 여러 번 강조된 심각한 영향 관계만 추출

## ⚠️ relations와 influences 중복 금지 규칙
- **같은 두 사람(A, B) 사이에 relations과 influences 둘 다 기록 금지**
- influences에 (A→B) 또는 (B→A)가 있으면, relations에 (A, B) 추가하지 말 것
- 우선순위: influences > relations (학대/집착이 있으면 influences만 기록)

## siblingGroups 규칙 (인접 리스트) ⚠️ 핵심!
같은 부모를 공유하는 형제자매 그룹:
- parentCoupleKey: "부id-모id" 형식 (children 배열의 부모 조합과 일치)
- siblingIds: 해당 부모의 자녀 id 배열 (birthOrder순 정렬)

예시:
- children: [[5, 6, 1], [5, 6, 2], [5, 6, 3]] (부모 5,6의 자녀 1,2,3)
- siblingGroups: [{ parentCoupleKey: "5-6", siblingIds: [1, 2, 3] }]

## nuclearFamilies 규칙 (인접 리스트) ⚠️ 핵심!
최소단위 가족 (부부 + 직계 자녀):
- husbandId: 남편 id (없으면 null)
- wifeId: 아내 id (없으면 null)
- childrenIds: 자녀 id 배열 (birthOrder순 정렬, 없으면 빈 배열)
- generation: 세대 번호
  - 0: IP가 속한 세대 (IP 본인 또는 IP의 배우자가 부부인 경우)
  - -1: IP의 부모 세대
  - -2: IP의 조부모 세대
  - 1: IP의 자녀 세대
  - 2: IP의 손자녀 세대

### ⚠️⚠️⚠️ 세대 판별 핵심 규칙 (절대 위반 금지!)

**규칙 1: IP의 형제자매와 그 배우자는 반드시 generation=0**
- IP의 형, 누나, 동생 등 모든 형제자매 → generation=0
- IP 형제자매의 배우자 → generation=0 (부모 세대 아님!)
- 예: IP의 형(id=3)과 형수(id=4) 부부 → { husbandId: 3, wifeId: 4, childrenIds: [...], generation: 0 }

**규칙 2: generation은 "부부" 기준으로 결정**
- nuclearFamily의 generation은 husbandId/wifeId 부부의 세대
- childrenIds는 해당 세대+1에 해당하지만, nuclearFamily의 generation 값은 부모 기준

**규칙 3: 같은 siblingGroup에 속한 사람들은 모두 같은 세대**
- siblingGroups에서 같은 parentCoupleKey를 가진 형제자매 → 모두 동일 세대
- 이들이 각각 결혼해서 만든 nuclearFamily → 모두 같은 generation 값

예시 (IP가 3남매 중 막내, 형과 누나가 각각 결혼한 경우):
- siblingGroups: [{ parentCoupleKey: "5-6", siblingIds: [3, 2, 1] }]  // 형(3), 누나(2), IP(1)
- nuclearFamilies: [
    { husbandId: 1, wifeId: 10, childrenIds: [], generation: 0 },   // IP 부부 ✓
    { husbandId: 3, wifeId: 11, childrenIds: [7], generation: 0 },  // 형 부부 ✓ (0이어야 함!)
    { husbandId: 12, wifeId: 2, childrenIds: [8], generation: 0 },  // 누나 부부 ✓ (0이어야 함!)
    { husbandId: 5, wifeId: 6, childrenIds: [3, 2, 1], generation: -1 }  // IP 부모 ✓
  ]

❌ 틀린 예시:
- { husbandId: 3, wifeId: 11, childrenIds: [7], generation: -1 }  // 형 부부를 부모 세대로 잘못 분류!

## partners 배열과 nuclearFamilies 일관성 ⚠️ 필수!
- **모든 부부 관계는 partners 배열에 반드시 포함되어야 함**
- nuclearFamilies의 husbandId-wifeId 쌍은 모두 partners에 존재해야 함
- 자녀가 없는 부부도 partners에 포함 (nuclearFamilies에는 childrenIds: []로)
- 예: partners에 [5, 6]이 있으면 nuclearFamilies에도 { husbandId: 5, wifeId: 6, ... } 존재해야 함

## ⚠️⚠️⚠️ 출력 전 필수 검증 체크리스트

출력하기 전에 반드시 아래 항목을 모두 검증하세요:

### 1. siblingGroups ↔ nuclearFamilies 일관성 검증
- [ ] siblingGroups의 모든 siblingIds가 해당하는 nuclearFamily의 childrenIds에 포함되어 있는가?
- [ ] siblingGroups의 parentCoupleKey("부id-모id")가 nuclearFamilies의 husbandId-wifeId와 일치하는가?
- [ ] 같은 siblingGroup에 속한 형제자매가 각각 결혼한 경우, 그들의 nuclearFamily generation이 모두 동일한가?

### 2. partners ↔ nuclearFamilies 일관성 검증
- [ ] nuclearFamilies의 모든 husbandId-wifeId 쌍이 partners 배열에 존재하는가?
- [ ] partners에 있는 모든 부부가 nuclearFamilies에도 존재하는가? (자녀 없으면 childrenIds: [])

### 3. 세대(generation) 검증
- [ ] IP(isIP=true)가 포함된 nuclearFamily의 generation이 0인가?
- [ ] IP의 형제자매가 결혼해서 만든 nuclearFamily의 generation도 0인가? (부모 세대 -1이 아님!)
- [ ] IP의 부모 nuclearFamily의 generation이 -1인가?
- [ ] 세대 간 점프가 없는가? (예: 0에서 바로 -2로 넘어가지 않음)

### 4. children 배열 검증
- [ ] siblingGroups의 모든 siblingIds가 children 배열에 포함되어 있는가?
- [ ] nuclearFamilies의 모든 childrenIds가 children 배열에 포함되어 있는가?
- [ ] children 배열의 부모id 조합이 siblingGroups의 parentCoupleKey와 일치하는가?

### 검증 실패 시 수정 후 다시 검증!

## 입력 (상담 축어록)
{transcripts}

JSON만 출력.`;

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의 - AI 출력용 (좌표 없음)
// ─────────────────────────────────────────────────────────────────────────────

type AIPartnerStatus =
  | 'marriage'
  | 'divorced'
  | 'separated'
  | 'cohabiting'
  | 'engaged';
type AIChildStatus = 'biological' | 'adopted' | 'foster';
type AIInfluenceStatus =
  | 'physical_abuse'
  | 'emotional_abuse'
  | 'sexual_abuse'
  | 'focused_on'
  | 'focused_on_negatively';

/** 형제자매 그룹 (같은 부모를 공유) */
interface AISiblingGroup {
  parentCoupleKey: string; // "fatherId-motherId" 형식
  siblingIds: number[]; // birthOrder 순서로 정렬됨
}

/** 최소단위 가족 (부부 + 직계 자녀) */
interface AINuclearFamily {
  husbandId: number | null;
  wifeId: number | null;
  childrenIds: number[]; // birthOrder 순서로 정렬됨
  generation: number; // 0=IP세대, -1=부모, -2=조부모, 1=자녀, 2=손자녀
}

/** AI가 출력하는 개인 정보 (좌표 없음) */
interface AISubject {
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

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의 - API 요청/응답
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateFamilySummaryRequest {
  client_id: string;
  force_refresh?: boolean;
}

interface GenerateFamilySummaryResponse {
  success: boolean;
  data?: {
    client_id: string;
    ai_output: AIGenogramOutput; // AI 원본 응답
    stats: {
      total_transcripts: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface TranscriptInfo {
  id: string;
  session_id: string;
  contents: string;
  source_table: 'transcribes' | 'handwritten_transcribes';
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM 호출 함수
// ─────────────────────────────────────────────────────────────────────────────

const GPT_MODEL = 'gpt-4.1-2025-04-14';

async function callGPTForJSON<T>(prompt: string): Promise<T> {
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 32768,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  console.log(`[callGPTForJSON] contentLength=${content.length}`);
  console.log(`[callGPTForJSON] RAW OUTPUT START ===`);
  console.log(content);
  console.log(`[callGPTForJSON] RAW OUTPUT END ===`);

  try {
    return JSON.parse(content) as T;
  } catch (e) {
    console.log(
      `[callGPTForJSON] parseError=${e instanceof Error ? e.message : e}`
    );
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    throw new Error(`JSON 파싱 실패: ${content.substring(0, 500)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 데이터 조회 함수
// ─────────────────────────────────────────────────────────────────────────────

async function getClientTranscripts(
  supabase: SupabaseClient,
  clientId: string
): Promise<TranscriptInfo[]> {
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('client_id', clientId);

  if (sessionError) {
    throw new Error(`세션 조회 실패: ${sessionError.message}`);
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s: { id: string }) => s.id);
  const transcripts: TranscriptInfo[] = [];

  const { data: transcribesData, error: transcribesError } = await supabase
    .from('transcribes')
    .select('id, session_id, parsed_text, contents')
    .in('session_id', sessionIds);

  if (!transcribesError && transcribesData) {
    for (const t of transcribesData) {
      const contentsText =
        t.parsed_text ||
        (t.contents as { raw_output?: string })?.raw_output ||
        '';

      if (contentsText.trim()) {
        transcripts.push({
          id: t.id,
          session_id: t.session_id,
          contents: contentsText,
          source_table: 'transcribes',
        });
      }
    }
  }

  const { data: handwrittenData, error: handwrittenError } = await supabase
    .from('handwritten_transcribes')
    .select('id, session_id, contents')
    .in('session_id', sessionIds);

  if (!handwrittenError && handwrittenData) {
    for (const t of handwrittenData) {
      if (t.contents?.trim()) {
        transcripts.push({
          id: t.id,
          session_id: t.session_id,
          contents: t.contents,
          source_table: 'handwritten_transcribes',
        });
      }
    }
  }

  return transcripts;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 출력 검증 및 수정 함수
// ─────────────────────────────────────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixed: AIGenogramOutput;
}

function validateAndFixAIOutput(output: AIGenogramOutput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixed = JSON.parse(JSON.stringify(output)) as AIGenogramOutput;

  // 1. IP 찾기
  const ipSubject = fixed.subjects.find((s) => s.isIP);
  if (!ipSubject) {
    errors.push('IP(isIP=true)가 subjects에 없습니다.');
  }

  // 2. siblingGroups와 nuclearFamilies 교차 검증
  const siblingGroupMap = new Map<string, number[]>();
  for (const sg of fixed.siblingGroups) {
    siblingGroupMap.set(sg.parentCoupleKey, sg.siblingIds);
  }

  const nuclearFamilyMap = new Map<string, AINuclearFamily>();
  for (const nf of fixed.nuclearFamilies) {
    const key = `${nf.husbandId}-${nf.wifeId}`;
    nuclearFamilyMap.set(key, nf);
  }

  // 2-1. siblingGroups의 parentCoupleKey가 nuclearFamilies에 존재하는지 확인
  for (const [parentCoupleKey, siblingIds] of siblingGroupMap) {
    const nf = nuclearFamilyMap.get(parentCoupleKey);
    if (!nf) {
      errors.push(
        `siblingGroups의 parentCoupleKey="${parentCoupleKey}"에 해당하는 nuclearFamily가 없습니다.`
      );
      continue;
    }

    // 2-2. siblingIds와 childrenIds 일치 확인
    const nfChildrenSet = new Set(nf.childrenIds);
    for (const siblingId of siblingIds) {
      if (!nfChildrenSet.has(siblingId)) {
        warnings.push(
          `siblingId=${siblingId}가 nuclearFamily(${parentCoupleKey})의 childrenIds에 없습니다. 추가합니다.`
        );
        nf.childrenIds.push(siblingId);
      }
    }
  }

  // 3. partners와 nuclearFamilies 일관성 검증
  const partnerSet = new Set<string>();
  for (const [id1, id2] of fixed.partners) {
    partnerSet.add(`${id1}-${id2}`);
    partnerSet.add(`${id2}-${id1}`);
  }

  for (const nf of fixed.nuclearFamilies) {
    if (nf.husbandId && nf.wifeId) {
      const key1 = `${nf.husbandId}-${nf.wifeId}`;
      const key2 = `${nf.wifeId}-${nf.husbandId}`;
      if (!partnerSet.has(key1) && !partnerSet.has(key2)) {
        warnings.push(
          `nuclearFamily의 부부(${nf.husbandId}, ${nf.wifeId})가 partners에 없습니다. 추가합니다.`
        );
        fixed.partners.push([nf.husbandId, nf.wifeId, 'marriage']);
        partnerSet.add(key1);
        partnerSet.add(key2);
      }
    }
  }

  // 4. 세대 검증 - IP 형제자매의 nuclearFamily가 올바른 세대인지 확인
  if (ipSubject) {
    let ipSiblingGroup: AISiblingGroup | undefined;
    for (const sg of fixed.siblingGroups) {
      if (sg.siblingIds.includes(ipSubject.id)) {
        ipSiblingGroup = sg;
        break;
      }
    }

    if (ipSiblingGroup) {
      const ipSiblings = new Set(ipSiblingGroup.siblingIds);

      for (const nf of fixed.nuclearFamilies) {
        const isIPSiblingFamily =
          (nf.husbandId && ipSiblings.has(nf.husbandId)) ||
          (nf.wifeId && ipSiblings.has(nf.wifeId));

        const isParentFamily = nf.childrenIds.some((id) => ipSiblings.has(id));

        if (isIPSiblingFamily && !isParentFamily && nf.generation !== 0) {
          warnings.push(
            `IP 형제자매의 nuclearFamily(husband=${nf.husbandId}, wife=${nf.wifeId})의 generation이 ${nf.generation}입니다. 0으로 수정합니다.`
          );
          nf.generation = 0;
        }
      }
    }
  }

  // 5. children 배열과 siblingGroups 일관성 검증
  const childrenInArray = new Set<number>();
  for (const [, , childId] of fixed.children) {
    childrenInArray.add(childId);
  }

  for (const sg of fixed.siblingGroups) {
    const [fatherId, motherId] = sg.parentCoupleKey.split('-').map(Number);
    for (const childId of sg.siblingIds) {
      if (!childrenInArray.has(childId)) {
        warnings.push(
          `siblingGroups의 자녀(id=${childId})가 children 배열에 없습니다. 추가합니다.`
        );
        fixed.children.push([fatherId, motherId, childId, 'biological']);
        childrenInArray.add(childId);
      }
    }
  }

  const isValid = errors.length === 0;

  if (errors.length > 0 || warnings.length > 0) {
    console.log('[validateAndFixAIOutput] Validation results:');
    errors.forEach((e) => console.log(`  ERROR: ${e}`));
    warnings.forEach((w) => console.log(`  WARNING (fixed): ${w}`));
  }

  return { isValid, errors, warnings, fixed };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 분석 함수
// ─────────────────────────────────────────────────────────────────────────────

async function analyzeTranscripts(
  transcripts: TranscriptInfo[]
): Promise<AIGenogramOutput> {
  console.log(`[analyzeTranscripts] START, count=${transcripts.length}`);

  if (transcripts.length === 0) {
    return {
      subjects: [],
      partners: [],
      children: [],
      fetus: [],
      relations: [],
      influences: [],
      siblingGroups: [],
      nuclearFamilies: [],
    };
  }

  const allTranscriptsText = transcripts
    .map((t, i) => `[세션 ${i + 1}]\n${t.contents}`)
    .join('\n\n---\n\n');

  console.log(
    `[analyzeTranscripts] Combined transcripts length: ${allTranscriptsText.length}`
  );

  const prompt = GENOGRAM_JSON_PROMPT.replace(
    '{transcripts}',
    allTranscriptsText
  );
  const aiOutput = await callGPTForJSON<AIGenogramOutput>(prompt);

  console.log(
    `[analyzeTranscripts] AI output: subjects=${aiOutput.subjects?.length ?? 0}, ` +
      `partners=${aiOutput.partners?.length ?? 0}, ` +
      `children=${aiOutput.children?.length ?? 0}, ` +
      `influences=${aiOutput.influences?.length ?? 0}, ` +
      `siblingGroups=${aiOutput.siblingGroups?.length ?? 0}, ` +
      `nuclearFamilies=${aiOutput.nuclearFamilies?.length ?? 0}`
  );

  // 기본값 보장 후 검증
  const rawOutput: AIGenogramOutput = {
    subjects: aiOutput.subjects || [],
    partners: aiOutput.partners || [],
    children: aiOutput.children || [],
    fetus: aiOutput.fetus || [],
    relations: aiOutput.relations || [],
    influences: aiOutput.influences || [],
    siblingGroups: aiOutput.siblingGroups || [],
    nuclearFamilies: aiOutput.nuclearFamilies || [],
  };

  // 검증 및 자동 수정
  const { fixed, errors, warnings } = validateAndFixAIOutput(rawOutput);

  console.log(
    `[analyzeTranscripts] Validation: errors=${errors.length}, warnings=${warnings.length}`
  );

  return fixed;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 핸들러 (Vercel API Route)
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  console.log('[genogram/summary] 요청 시작', { method: req.method });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '인증 토큰이 필요합니다.',
      },
    } satisfies GenerateFamilySummaryResponse);
    return;
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient(accessToken);

  try {
    const body = req.body as GenerateFamilySummaryRequest;
    console.log('[genogram/summary] 요청 바디:', { client_id: body.client_id });

    if (!body.client_id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'client_id가 필요합니다.',
        },
      } satisfies GenerateFamilySummaryResponse);
      return;
    }

    // 축어록 조회
    console.log('[genogram/summary] 축어록 조회 시작');
    const transcripts = await getClientTranscripts(supabase, body.client_id);
    console.log('[genogram/summary] 축어록 조회 완료:', {
      count: transcripts.length,
    });

    if (transcripts.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_TRANSCRIPTS',
          message: '연결된 축어록이 없습니다.',
        },
      } satisfies GenerateFamilySummaryResponse);
      return;
    }

    // AI 분석 (좌표 계산 없이 원본 응답 반환)
    console.log('[genogram/summary] AI 분석 시작');
    const aiOutput = await analyzeTranscripts(transcripts);
    console.log('[genogram/summary] AI 분석 완료');

    // clients 테이블의 family_summary 컬럼에 저장
    console.log('[genogram/summary] family_summary 저장 시작');
    const { error: updateError } = await supabase
      .from('clients')
      .update({ family_summary: aiOutput })
      .eq('id', body.client_id);

    if (updateError) {
      console.error(
        '[genogram/summary] family_summary 저장 실패:',
        updateError
      );
      // 저장 실패해도 응답은 반환 (warning만 로깅)
    } else {
      console.log('[genogram/summary] family_summary 저장 완료');
    }

    // AI 원본 응답 반환 (캔버스 변환은 프론트에서 처리)
    res.status(200).json({
      success: true,
      data: {
        client_id: body.client_id,
        ai_output: aiOutput,
        stats: {
          total_transcripts: transcripts.length,
        },
      },
    } satisfies GenerateFamilySummaryResponse);
  } catch (error) {
    console.error('[genogram/summary] 에러 발생:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
    } satisfies GenerateFamilySummaryResponse);
  }
}
