/**
 * generate-family-summary API
 *
 * 이 파일은 Vercel API Route로 구현된 가계도 AI 분석 파이프라인입니다.
 * AI가 축어록을 분석하여 가족 구조 데이터를 JSON으로 반환합니다.
 * 좌표 계산 및 캔버스 변환은 프론트엔드(aiJsonConverter.ts)에서 처리합니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsonrepair } from 'jsonrepair';
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

### ⚠️⚠️⚠️ 형제자매 관계 해석 규칙 (절대 위반 금지!)
"XX의 언니/형/누나/오빠/동생/남동생/여동생"은 **형제자매 관계**입니다!
- "정미경의 언니" = 정미경과 언니는 **같은 부모의 자녀** (형제자매)
- "철수의 형" = 철수와 형은 **같은 부모의 자녀** (형제자매)
- ❌ 절대 틀리면 안 됨: "정미경의 언니"가 정미경의 **부모**가 아님!
- ❌ 절대 틀리면 안 됨: 언니의 배우자가 정미경의 **부모**가 아님!

**올바른 해석 예시:**
- "정미경의 언니"와 "정미경" → 둘 다 "정미경의 부모"의 자녀
- siblingGroups: { parentCoupleKey: "정미경아버지id-정미경어머니id", siblingIds: [언니id, 정미경id] }

**틀린 해석 예시 (절대 금지!):**
- ❌ children: [언니id, 언니남편id, 정미경id] (언니가 정미경의 부모로 잘못 해석!)

### ⚠️⚠️⚠️ 부모의 형제자매 = 조부모의 자녀 (절대 위반 금지!)
"아버지의 남동생/여동생/형/누나"는 아버지와 **같은 부모(조부모)의 자녀**입니다!
- "아버지의 남동생" = 아버지와 남동생은 **같은 조부모의 자녀** (형제자매)
- "아버지의 여동생" = 아버지와 여동생은 **같은 조부모의 자녀** (형제자매)

**올바른 예시:**
- 아버지(5), 아버지의 남동생(9), 아버지의 여동생(10) → 모두 조부모(8-7)의 자녀
- siblingGroups: { parentCoupleKey: "8-7", siblingIds: [5, 9, 10] }
- children: [8, 7, 5], [8, 7, 9], [8, 7, 10] 모두 포함!

**틀린 예시 (절대 금지!):**
- ❌ siblingGroups: { parentCoupleKey: "8-7", siblingIds: [5] } (9, 10 누락!)
- ❌ 아버지만 조부모의 자녀로 등록하고, 아버지의 형제자매는 별도 트리로 처리

### ⚠️⚠️⚠️ 배우자는 siblingGroup에 포함하지 않음 (절대 위반 금지!)
**siblingGroups에는 혈연관계인 형제자매만 포함!** 배우자는 절대 포함하지 않습니다!
- "아버지의 남동생의 배우자"는 조부모의 자녀가 **아닙니다!**
- "아버지의 여동생의 배우자"는 조부모의 자녀가 **아닙니다!**
- 배우자는 partners 배열에만 등록하고, siblingGroups/children에는 포함하지 않습니다.

**올바른 예시:**
- 아버지의 남동생(9)과 그 배우자(14)
- siblingGroups: { parentCoupleKey: "8-7", siblingIds: [5, 9, 10] } ← 14는 미포함!
- children: [8, 7, 5], [8, 7, 9], [8, 7, 10] ← [8, 7, 14]는 없음!
- partners: [9, 14, "marriage"] ← 배우자 관계만 등록

**틀린 예시 (절대 금지!):**
- ❌ siblingGroups: { parentCoupleKey: "8-7", siblingIds: [5, 9, 10, 14, 15] } (배우자 14, 15 포함!)
- ❌ children: [8, 7, 14] (배우자가 조부모의 자녀로 잘못 등록!)

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

## relations 규칙 (엄격히 제한!)
- 형식: [id1, id2, status, 관계설명]
- status 값: "Connected" | "Close" | "Fused" | "Distant" | "Hostile" | "Close_Hostile" | "Fused_Hostile" | "Cutoff" | "Cutoff_Repaired"
  - Connected: 일반적 연결
  - Close: 친밀함
  - Fused: 융합(과도한 밀착)
  - Distant: 거리감/소원함
  - Hostile: 적대/갈등
  - Close_Hostile: 친밀하지만 갈등 있음
  - Fused_Hostile: 융합적이면서 갈등
  - Cutoff: 단절
  - Cutoff_Repaired: 단절 후 회복
- ⚠️ **최대 3개까지만 기록** (가장 핵심적인 관계만 선별)
- ⚠️ **일반적인 관계는 제외** - 단순히 "친밀함", "사이가 좋음" 정도는 기록하지 않음
- **기록할 관계**: 갈등, 적대, 단절, 융합(과도한 밀착), 삼각관계 등 **문제적 관계만**
- 구조적 관계(형제, 부모, 자녀)는 포함하지 말 것
- ⚠️ **반복적으로 언급된 관계만 기록** (1회 언급은 무시)
- 축어록에서 여러 번 강조된 핵심 문제 관계만 추출

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

### ⚠️⚠️⚠️ husbandId/wifeId 성별 규칙 (절대 위반 금지!)
- **husbandId는 반드시 Male 성별의 id**
- **wifeId는 반드시 Female 성별의 id**
- 예: 아버지(id=5, Male)와 어머니(id=6, Female) → { husbandId: 5, wifeId: 6 } ✓
- ❌ 틀린 예시: { husbandId: 6, wifeId: 5 } (성별이 반대!)

**엣지케이스:**
- Gay 커플: 두 명 모두 Male → 먼저 언급된 사람이 husbandId
- Lesbian 커플: 두 명 모두 Female → 먼저 언급된 사람이 husbandId (편의상)
- Transgender: 원래 성별이 아닌 현재 정체성 기준 (Transgender_Male → Male 취급, Transgender_Female → Female 취급)
- Nonbinary: 배우자 성별에 따라 반대 역할 배정, 둘 다 Nonbinary면 먼저 언급된 사람이 husbandId

**siblingGroups의 parentCoupleKey도 동일 규칙:**
- parentCoupleKey: "부id-모id" 형식 (husbandId-wifeId 순서)
- 예: 아버지(5)-어머니(6) → "5-6" ✓
- ❌ 틀린 예시: "6-5" (성별 순서가 반대!)

### ⚠️⚠️⚠️ 세대 판별 핵심 규칙 (절대 위반 금지!)

**규칙 1: IP의 형제자매와 그 배우자는 반드시 generation=0**
- IP의 형, 누나, 동생 등 모든 형제자매 → generation=0
- IP 형제자매의 배우자 → generation=0 (부모 세대 아님!)
- 예: IP의 형(id=3)과 형수(id=4) 부부 → { husbandId: 3, wifeId: 4, childrenIds: [...], generation: 0 }

**규칙 1-2: IP 배우자의 형제자매와 그 배우자도 반드시 generation=0**
- IP의 배우자가 있는 경우, 배우자의 형제자매도 모두 → generation=0
- IP 배우자의 형제자매가 결혼해서 만든 nuclearFamily → generation=0
- 예: IP(id=1)의 배우자(id=2)가 있고, 배우자의 형(id=3)이 있는 경우
  → 배우자의 형 부부 { husbandId: 3, wifeId: 4, childrenIds: [...], generation: 0 }
- ❌ 틀린 예시: IP 배우자의 형제자매 nuclearFamily를 generation=-1로 설정

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

type AIRelationStatus =
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
  relations: [number, number, AIRelationStatus, string][]; // [id1, id2, status, description]
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

    // jsonrepair로 손상된 JSON 복구 시도
    try {
      const repairedContent = jsonrepair(content);
      console.log(`[callGPTForJSON] JSON repaired successfully`);
      return JSON.parse(repairedContent) as T;
    } catch (repairError) {
      console.log(
        `[callGPTForJSON] jsonrepair failed=${repairError instanceof Error ? repairError.message : repairError}`
      );
    }

    // ```json``` 블록에서 추출 시도
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as T;
      } catch {
        // 추출된 JSON도 손상된 경우 jsonrepair 시도
        const repairedExtracted = jsonrepair(jsonMatch[1]);
        console.log(`[callGPTForJSON] Extracted JSON repaired successfully`);
        return JSON.parse(repairedExtracted) as T;
      }
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

/**
 * 성별을 Male/Female 기준으로 정규화
 * Transgender_Male → Male, Transgender_Female → Female
 * Gay → Male, Lesbian → Female
 */
function normalizeGenderForRole(
  gender: AISubject['gender']
): 'Male' | 'Female' | 'Nonbinary' | undefined {
  if (!gender) return undefined;

  switch (gender) {
    case 'Male':
    case 'Gay':
    case 'Transgender_Male':
      return 'Male';
    case 'Female':
    case 'Lesbian':
    case 'Transgender_Female':
      return 'Female';
    case 'Nonbinary':
      return 'Nonbinary';
    default:
      return undefined;
  }
}

function validateAndFixAIOutput(output: AIGenogramOutput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixed = JSON.parse(JSON.stringify(output)) as AIGenogramOutput;

  // 0. 배열 전처리: AI가 잘못된 형식의 데이터를 섞어넣는 경우 필터링
  // children: [fatherId, motherId, childId, status?, memo?] 형식이어야 함
  const originalChildrenCount = fixed.children.length;
  fixed.children = fixed.children.filter((child) => {
    // 배열이 아니면 제거 (예: {"note": "..."} 같은 객체)
    if (!Array.isArray(child)) return false;
    // childId(세 번째 요소)가 null이거나 숫자가 아니면 제거
    if (child[2] === null || typeof child[2] !== 'number') return false;
    return true;
  });
  if (fixed.children.length < originalChildrenCount) {
    warnings.push(
      `children 배열에서 잘못된 형식의 항목 ${originalChildrenCount - fixed.children.length}개를 제거했습니다.`
    );
  }

  // relations: [id1, id2, status, description] 형식이어야 함
  // 3개 요소 형식([id1, id2, description])도 4개로 변환
  const originalRelationsCount = fixed.relations.length;
  // AI 출력이 3개 또는 4개 요소일 수 있으므로 unknown[]로 캐스팅
  const rawRelations = fixed.relations as unknown as unknown[][];
  fixed.relations = rawRelations
    .filter((rel): rel is unknown[] => {
      if (!Array.isArray(rel)) return false;
      if (typeof rel[0] !== 'number' || typeof rel[1] !== 'number') return false;
      return true;
    })
    .map((rel): [number, number, AIRelationStatus, string] => {
      // 3개 요소면 status를 description에서 추론하여 4개로 변환
      if (rel.length === 3) {
        const description = String(rel[2] || '');
        let status: AIRelationStatus = 'Connected';
        if (/단절|끊|연락.*(안|없)/.test(description)) status = 'Cutoff';
        else if (/갈등|적대|충돌|다툼|싸움/.test(description)) status = 'Hostile';
        else if (/융합|밀착|과도.*친밀/.test(description)) status = 'Fused';
        else if (/소원|거리|멀어/.test(description)) status = 'Distant';
        else if (/친밀/.test(description)) status = 'Close';
        return [rel[0] as number, rel[1] as number, status, description];
      }
      return [rel[0] as number, rel[1] as number, rel[2] as AIRelationStatus, String(rel[3] || '')];
    });
  if (fixed.relations.length < originalRelationsCount) {
    warnings.push(
      `relations 배열에서 잘못된 형식의 항목 ${originalRelationsCount - fixed.relations.length}개를 제거했습니다.`
    );
  }

  // subjects를 id로 빠르게 조회할 수 있도록 Map 생성
  const subjectById = new Map<number, AISubject>();
  for (const s of fixed.subjects) {
    subjectById.set(s.id, s);
  }

  // 1. IP 찾기
  const ipSubject = fixed.subjects.find((s) => s.isIP);
  if (!ipSubject) {
    errors.push('IP(isIP=true)가 subjects에 없습니다.');
  }

  // 1.5. husbandId/wifeId 성별 검증 및 자동 스왑
  for (const nf of fixed.nuclearFamilies) {
    if (nf.husbandId === null || nf.wifeId === null) continue;

    const husband = subjectById.get(nf.husbandId);
    const wife = subjectById.get(nf.wifeId);

    if (!husband || !wife) continue;

    const husbandNormalizedGender = normalizeGenderForRole(husband.gender);
    const wifeNormalizedGender = normalizeGenderForRole(wife.gender);

    // 두 사람 모두 같은 성별이면 스왑하지 않음 (먼저 언급된 순서 유지)
    if (husbandNormalizedGender === wifeNormalizedGender) {
      continue;
    }

    // husbandId가 Female이고 wifeId가 Male이면 스왑 필요
    if (
      husbandNormalizedGender === 'Female' &&
      wifeNormalizedGender === 'Male'
    ) {
      warnings.push(
        `nuclearFamily(husband=${nf.husbandId}, wife=${nf.wifeId})의 husbandId/wifeId 성별이 반대입니다. 스왑합니다.`
      );
      const temp = nf.husbandId;
      nf.husbandId = nf.wifeId;
      nf.wifeId = temp;
    }

    // Nonbinary 처리: 배우자가 Male이면 Nonbinary를 wife로, Female이면 husband로
    if (husbandNormalizedGender === 'Nonbinary') {
      if (wifeNormalizedGender === 'Male') {
        // 스왑 필요: Nonbinary를 wife로, Male을 husband로
        warnings.push(
          `nuclearFamily(husband=${nf.husbandId}, wife=${nf.wifeId}): Nonbinary를 wife로, Male을 husband로 스왑합니다.`
        );
        const temp = nf.husbandId;
        nf.husbandId = nf.wifeId;
        nf.wifeId = temp;
      }
      // wifeNormalizedGender가 Female이면 현재 상태 유지 (Nonbinary가 husband)
    } else if (wifeNormalizedGender === 'Nonbinary') {
      if (husbandNormalizedGender === 'Female') {
        // 스왑 필요: Female을 wife로, Nonbinary를 husband로
        warnings.push(
          `nuclearFamily(husband=${nf.husbandId}, wife=${nf.wifeId}): Female을 wife로, Nonbinary를 husband로 스왑합니다.`
        );
        const temp = nf.husbandId;
        nf.husbandId = nf.wifeId;
        nf.wifeId = temp;
      }
      // husbandNormalizedGender가 Male이면 현재 상태 유지 (Nonbinary가 wife)
    }
  }

  // 1.6. siblingGroups의 parentCoupleKey와 children 배열도 동일하게 수정
  // nuclearFamilies의 수정된 husbandId-wifeId 순서와 일치시킴
  const updatedNuclearFamilyKeys = new Map<string, string>();
  // 스왑된 부부 쌍 기록: "wrongKey" -> [correctFatherId, correctMotherId]
  const swappedCouples = new Map<string, [number, number]>();

  for (const nf of fixed.nuclearFamilies) {
    if (nf.husbandId !== null && nf.wifeId !== null) {
      // 원래 키 (둘 다 방향)
      const key1 = `${nf.husbandId}-${nf.wifeId}`;
      const key2 = `${nf.wifeId}-${nf.husbandId}`;
      // 수정된 키 (husbandId-wifeId 순서)
      const correctKey = key1;
      updatedNuclearFamilyKeys.set(key1, correctKey);
      updatedNuclearFamilyKeys.set(key2, correctKey);
      // 스왑된 쌍 기록 (양방향)
      swappedCouples.set(key1, [nf.husbandId, nf.wifeId]);
      swappedCouples.set(key2, [nf.husbandId, nf.wifeId]);
    }
  }

  for (const sg of fixed.siblingGroups) {
    const correctKey = updatedNuclearFamilyKeys.get(sg.parentCoupleKey);
    if (correctKey && correctKey !== sg.parentCoupleKey) {
      warnings.push(
        `siblingGroups의 parentCoupleKey "${sg.parentCoupleKey}"를 "${correctKey}"로 수정합니다.`
      );
      sg.parentCoupleKey = correctKey;
    }
  }

  // 1.7. children 배열의 [fatherId, motherId, ...] 순서도 수정
  // children: [fatherId, motherId, childId, status?, memo?]
  for (const child of fixed.children) {
    const fatherId = child[0];
    const motherId = child[1];
    if (fatherId === null || motherId === null) continue;

    const currentKey = `${fatherId}-${motherId}`;
    const correctParents = swappedCouples.get(currentKey);

    if (correctParents) {
      const [correctFatherId, correctMotherId] = correctParents;
      // 현재 순서가 올바른 순서와 다르면 스왑
      if (fatherId !== correctFatherId || motherId !== correctMotherId) {
        warnings.push(
          `children 배열의 부모 순서 [${fatherId}, ${motherId}]를 [${correctFatherId}, ${correctMotherId}]로 수정합니다.`
        );
        child[0] = correctFatherId;
        child[1] = correctMotherId;
      }
    }
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
  for (const [parentCoupleKey, siblingIds] of Array.from(siblingGroupMap)) {
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
  // ipSiblingGroup을 넓은 스코프에서 정의 (6번 검증에서도 사용)
  let ipSiblingGroup: AISiblingGroup | undefined;
  if (ipSubject) {
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

  // 6. ⚠️ 형제자매가 부모로 잘못 설정된 경우 감지 (심각한 에러!)
  // "XX의 언니/형/누나/오빠/동생" 패턴이 있는 사람이 XX의 부모로 설정되었는지 확인
  if (ipSubject) {
    const siblingPatterns = [
      /의\s*(언니|형|누나|오빠|동생|남동생|여동생|형제|자매)/,
    ];

    // IP의 형제자매로 추정되는 사람들 찾기 (이름 패턴으로)
    const ipName = ipSubject.name || '';
    const potentialSiblings = new Set<number>();

    for (const subject of fixed.subjects) {
      if (subject.id === ipSubject.id) continue;
      const name = subject.name || '';

      // "IP이름의 언니/형/동생" 패턴 확인
      if (ipName && name.includes(ipName)) {
        for (const pattern of siblingPatterns) {
          if (pattern.test(name)) {
            potentialSiblings.add(subject.id);
            break;
          }
        }
      }

      // "XX의 언니/형" 형태에서 XX가 IP인지 확인
      for (const pattern of siblingPatterns) {
        if (pattern.test(name)) {
          potentialSiblings.add(subject.id);
          break;
        }
      }
    }

    // 형제자매로 추정되는 사람이 IP의 부모로 설정되었는지 확인
    for (const nf of fixed.nuclearFamilies) {
      const isParentOfIP = nf.childrenIds.includes(ipSubject.id);
      if (!isParentOfIP) continue;

      const parentIds = [nf.husbandId, nf.wifeId].filter(
        (id) => id !== null
      ) as number[];

      for (const parentId of parentIds) {
        if (potentialSiblings.has(parentId)) {
          const parentSubject = subjectById.get(parentId);
          const parentName = parentSubject?.name || `id=${parentId}`;
          errors.push(
            `⚠️ 심각한 에러: "${parentName}"이(가) IP의 부모로 설정되었지만, 이름 패턴상 형제자매로 보입니다! ` +
              `"XX의 언니/형/동생"은 XX와 형제자매 관계이지, XX의 부모가 아닙니다. ` +
              `nuclearFamily(husband=${nf.husbandId}, wife=${nf.wifeId})를 확인하세요.`
          );
        }
      }
    }

    // IP와 같은 siblingGroup에 있는 사람의 배우자가 IP의 부모로 설정되었는지 확인
    if (ipSiblingGroup) {
      const ipSiblingIds = new Set(ipSiblingGroup.siblingIds);

      // IP 형제자매의 배우자 ID 수집
      const siblingSpouseIds = new Set<number>();
      for (const siblingId of Array.from(ipSiblingIds)) {
        if (siblingId === ipSubject.id) continue;
        const sibling = subjectById.get(siblingId);
        if (sibling?.spouseId) {
          siblingSpouseIds.add(sibling.spouseId);
        }
      }

      // 형제자매 또는 그 배우자가 IP의 부모로 설정되었는지 확인
      for (const nf of fixed.nuclearFamilies) {
        const isParentOfIP = nf.childrenIds.includes(ipSubject.id);
        if (!isParentOfIP) continue;

        const parentIds = [nf.husbandId, nf.wifeId].filter(
          (id) => id !== null
        ) as number[];

        for (const parentId of parentIds) {
          // 형제자매가 부모로 설정됨
          if (ipSiblingIds.has(parentId) && parentId !== ipSubject.id) {
            const parentSubject = subjectById.get(parentId);
            const parentName = parentSubject?.name || `id=${parentId}`;
            errors.push(
              `⚠️ 심각한 에러: "${parentName}"(id=${parentId})이(가) IP의 부모로 설정되었지만, ` +
                `같은 siblingGroup에 있는 형제자매입니다! ` +
                `형제자매는 부모가 될 수 없습니다. nuclearFamily를 수정하세요.`
            );
          }

          // 형제자매의 배우자가 부모로 설정됨
          if (siblingSpouseIds.has(parentId)) {
            const parentSubject = subjectById.get(parentId);
            const parentName = parentSubject?.name || `id=${parentId}`;
            errors.push(
              `⚠️ 심각한 에러: "${parentName}"(id=${parentId})이(가) IP의 부모로 설정되었지만, ` +
                `IP 형제자매의 배우자입니다! ` +
                `형제자매의 배우자는 IP의 부모가 될 수 없습니다.`
            );
          }
        }
      }
    }
  }

  // 7. ⚠️ 배우자가 siblingGroup에 잘못 포함된 경우 제거
  // AI가 "아버지의 남동생의 배우자" 같은 배우자를 조부모의 자녀로 잘못 포함시키는 경우 수정
  for (const sg of fixed.siblingGroups) {
    const invalidSpouseIds: number[] = [];

    for (const siblingId of sg.siblingIds) {
      const subject = subjectById.get(siblingId);
      const name = subject?.name || '';

      // 배우자 패턴 체크: "~의 배우자", "~의 아내", "~의 남편" 등
      if (/배우자|의\s*아내|의\s*남편|의\s*처$|의\s*부$/.test(name)) {
        invalidSpouseIds.push(siblingId);
      }
    }

    // 잘못된 배우자 ID들을 siblingIds에서 제거
    if (invalidSpouseIds.length > 0) {
      for (const invalidId of invalidSpouseIds) {
        const idx = sg.siblingIds.indexOf(invalidId);
        if (idx !== -1) {
          const subject = subjectById.get(invalidId);
          warnings.push(
            `siblingGroup(${sg.parentCoupleKey})에서 배우자 "${subject?.name || invalidId}"(id=${invalidId})을(를) 제거했습니다.`
          );
          sg.siblingIds.splice(idx, 1);
        }
      }

      // children 배열에서도 해당 배우자를 조부모의 자녀로 등록한 항목 제거
      const [parentFatherId, parentMotherId] = sg.parentCoupleKey
        .split('-')
        .map(Number);

      fixed.children = fixed.children.filter((child) => {
        const [fId, mId, cId] = child;
        if (
          fId === parentFatherId &&
          mId === parentMotherId &&
          invalidSpouseIds.includes(cId)
        ) {
          const subject = subjectById.get(cId);
          warnings.push(
            `children 배열에서 배우자 [${fId}, ${mId}, ${cId}] ("${subject?.name || cId}")을(를) 제거했습니다.`
          );
          return false;
        }
        return true;
      });
    }
  }

  // 8. ⚠️ 부모의 형제자매가 조부모의 자녀로 등록되어 있는지 검증
  // "아버지의 남동생/여동생/형/누나", "어머니의 형제" 등의 패턴 확인
  // 주의: "아버지의 남동생의 배우자" 같은 패턴은 제외해야 함!
  if (ipSubject) {
    // 배우자 패턴 - 이 패턴에 매치되면 부모의 형제자매가 아님!
    const spouseExcludePattern = /배우자|의\s*아내|의\s*남편|의\s*처|의\s*부/;

    // 부모의 형제자매 패턴 (배우자/자녀 등이 뒤에 오면 제외)
    const parentSiblingPattern =
      /^(아버지|아빠|부친|어머니|엄마|모친)의?\s*(남동생|여동생|동생|형|오빠|누나|언니|형제|자매|삼촌|고모|이모|외삼촌)$/;

    // IP의 부모 찾기
    let ipFatherId: number | null = null;
    let ipMotherId: number | null = null;

    for (const nf of fixed.nuclearFamilies) {
      if (nf.childrenIds.includes(ipSubject.id)) {
        ipFatherId = nf.husbandId;
        ipMotherId = nf.wifeId;
        break;
      }
    }

    // 부모의 형제자매로 추정되는 사람들 찾기
    const parentSiblings: {
      subjectId: number;
      subjectName: string;
      relatedParentType: 'father' | 'mother';
    }[] = [];

    for (const subject of fixed.subjects) {
      const name = subject.name || '';

      // "~의 배우자", "~의 자녀" 등이 포함되면 스킵
      if (/배우자|자녀|아들|딸/.test(name) || spouseExcludePattern.test(name)) {
        continue;
      }

      const match = parentSiblingPattern.exec(name);

      if (match) {
        const parentType = match[1]; // 아버지, 어머니 등
        const isFatherSide = ['아버지', '아빠', '부친'].includes(parentType);
        parentSiblings.push({
          subjectId: subject.id,
          subjectName: name,
          relatedParentType: isFatherSide ? 'father' : 'mother',
        });
      }
    }

    // 각 부모의 형제자매에 대해 검증
    for (const ps of parentSiblings) {
      const relatedParentId =
        ps.relatedParentType === 'father' ? ipFatherId : ipMotherId;

      if (!relatedParentId) {
        warnings.push(
          `"${ps.subjectName}"은(는) ${ps.relatedParentType === 'father' ? '아버지' : '어머니'}의 형제자매로 보이지만, ` +
            `IP의 ${ps.relatedParentType === 'father' ? '아버지' : '어머니'}를 찾을 수 없습니다.`
        );
        continue;
      }

      // 해당 부모가 속한 siblingGroup 찾기 (부모의 형제자매 그룹 = 조부모의 자녀들)
      let parentSiblingGroup: AISiblingGroup | undefined;
      for (const sg of fixed.siblingGroups) {
        if (sg.siblingIds.includes(relatedParentId)) {
          parentSiblingGroup = sg;
          break;
        }
      }

      if (!parentSiblingGroup) {
        // 부모의 siblingGroup이 없으면 생성 필요할 수 있음
        warnings.push(
          `"${ps.subjectName}"(id=${ps.subjectId})은(는) ${ps.relatedParentType === 'father' ? '아버지' : '어머니'}의 형제자매이지만, ` +
            `부모(id=${relatedParentId})의 siblingGroup이 존재하지 않습니다. ` +
            `조부모의 자녀 그룹을 확인하세요.`
        );
        continue;
      }

      // 부모의 형제자매가 같은 siblingGroup에 있는지 확인
      if (!parentSiblingGroup.siblingIds.includes(ps.subjectId)) {
        errors.push(
          `⚠️ 심각한 에러: "${ps.subjectName}"(id=${ps.subjectId})은(는) ` +
            `${ps.relatedParentType === 'father' ? '아버지' : '어머니'}(id=${relatedParentId})의 형제자매이지만, ` +
            `같은 siblingGroup(parentCoupleKey=${parentSiblingGroup.parentCoupleKey})에 포함되어 있지 않습니다! ` +
            `부모의 형제자매는 조부모의 자녀로 등록되어야 합니다.`
        );

        // 자동 수정: siblingGroup에 추가
        parentSiblingGroup.siblingIds.push(ps.subjectId);
        warnings.push(
          `siblingGroup(${parentSiblingGroup.parentCoupleKey})에 "${ps.subjectName}"(id=${ps.subjectId})을(를) 추가했습니다.`
        );

        // children 배열에도 추가
        const [grandpaFatherId, grandpaMotherId] =
          parentSiblingGroup.parentCoupleKey.split('-').map(Number);
        if (!childrenInArray.has(ps.subjectId)) {
          fixed.children.push([
            grandpaFatherId,
            grandpaMotherId,
            ps.subjectId,
            'biological',
          ]);
          childrenInArray.add(ps.subjectId);
          warnings.push(
            `children 배열에 [${grandpaFatherId}, ${grandpaMotherId}, ${ps.subjectId}]을(를) 추가했습니다.`
          );
        }
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
