/**
 * generate-family-summary 통합 번들 파일
 *
 * 이 파일은 Vercel API Route로 구현된 가계도 데이터 AI 생성 파이프라인입니다.
 * 프론트엔드에서 Authorization 헤더로 사용자 토큰을 전달하면
 * RLS 정책에 따라 본인 데이터만 접근 가능합니다.
 *
 * 반환되는 genogram은 캔버스(GenogramPage)에서 바로 렌더링 가능한 SerializedGenogram 형식입니다.
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

// OpenAI 클라이언트 생성
const openai = new OpenAI({ apiKey: openaiApiKey });

/**
 * 사용자 토큰을 사용하여 Supabase 클라이언트 생성
 * RLS 정책에 따라 본인 데이터만 접근 가능
 */
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
// 상수 (캔버스 enum 값들)
// ─────────────────────────────────────────────────────────────────────────────

const GRID_SIZE = 30;

// 캔버스 SubjectType
const SubjectType = {
  Person: 'PERSON',
  Animal: 'ANIMAL',
  Fetus: 'FETUS',
} as const;

// 캔버스 Gender (7가지)
const Gender = {
  Male: 'Male',
  Female: 'Female',
  Gay: 'Gay',
  Lesbian: 'Lesbian',
  Transgender_Male: 'Transgender_Male',
  Transgender_Female: 'Transgender_Female',
  Nonbinary: 'Nonbinary',
} as const;

// 캔버스 Illness (9가지)
const Illness = {
  None: 'None',
  Psychological_Or_Physical_Problem: 'Psychological_Or_Physical_Problem',
  Alcohol_Or_Drug_Abuse: 'Alcohol_Or_Drug_Abuse',
  Suspected_Alcohol_Or_Drug_Abuse: 'Suspected_Alcohol_Or_Drug_Abuse',
  Psychological_Or_Physical_Illness_In_Remission:
    'Psychological_Or_Physical_Illness_In_Remission',
  In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
    'In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems',
  In_Recovery_From_Substance_Abuse: 'In_Recovery_From_Substance_Abuse',
  Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
    'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse',
  In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
    'In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems',
} as const;

// 캔버스 NodeSize
const NodeSize = {
  Small: 'SMALL',
  Default: 'DEFAULT',
  Large: 'LARGE',
} as const;

// 캔버스 ConnectionType
const ConnectionType = {
  Relation_Line: 'Relation_Line',
  Influence_Line: 'Influence_Line',
  Partner_Line: 'Partner_Line',
  Children_Parents_Line: 'Children_Parents_Line',
  Group_Line: 'Group_Line',
} as const;

// 캔버스 PartnerStatus (6가지)
const PartnerStatus = {
  Marriage: 'Marriage',
  Marital_Separation: 'Marital_Separation',
  Divorce: 'Divorce',
  Remarriage: 'Remarriage',
  Couple_Relationship: 'Couple_Relationship',
  Secret_Affair: 'Secret_Affair',
} as const;

// 캔버스 ParentChildStatus (8가지)
const ParentChildStatus = {
  Biological_Child: 'Biological_Child',
  Miscarriage: 'Miscarriage',
  Abortion: 'Abortion',
  Pregnancy: 'Pregnancy',
  Twins: 'Twins',
  Identical_Twins: 'Identical_Twins',
  Adopted_Child: 'Adopted_Child',
  Foster_Child: 'Foster_Child',
} as const;

// 캔버스 FetusStatus (3가지)
const FetusStatus = {
  Miscarriage: 'Miscarriage',
  Abortion: 'Abortion',
  Pregnancy: 'Pregnancy',
} as const;

// 캔버스 RelationStatus (9가지)
const RelationStatus = {
  Connected: 'Connected',
  Close: 'Close',
  Fused: 'Fused',
  Distant: 'Distant',
  Hostile: 'Hostile',
  Close_Hostile: 'Close_Hostile',
  Fused_Hostile: 'Fused_Hostile',
  Cutoff: 'Cutoff',
  Cutoff_Repaired: 'Cutoff_Repaired',
} as const;

// 캔버스 StrokeWidth
const StrokeWidth = {
  Default: 'DEFAULT',
} as const;

const DEFAULT_BG = '#FFFFFF';
const DEFAULT_FG = '#3C3C3C';

// ─────────────────────────────────────────────────────────────────────────────
// 프롬프트 정의
// ─────────────────────────────────────────────────────────────────────────────

const GENOGRAM_JSON_PROMPT = `상담 축어록에서 가족 정보를 추출하여 가계도 캔버스 데이터를 생성하세요.

## 작업 순서
1. 축어록에서 언급된 모든 가족 구성원을 식별
2. 각 구성원의 관계(부모, 자녀, 배우자, 형제 등)를 파악
3. 좌표 배치 규칙에 따라 x, y 좌표 계산
4. JSON 형식으로 출력

## 출력 형식
{
  "subjects": [
    {
      "id": 1,
      "type": "PERSON",
      "gender": "Male" 또는 해당 gender 타입,
      "name": "이름/호칭",
      "isIP": true/false,
      "isDead": true/false,
      "illness": "None" 또는 해당 illness 타입,
      "x": 숫자,
      "y": 숫자,
      "size": "DEFAULT" 또는 "SMALL",
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
  "couples": [[남편id, 아내id, "상태", "memo(선택)"]],
  "children": [[아버지id, 어머니id, 자녀id, "상태", "memo(선택)"]],
  "fetus": [[아버지id, 어머니id, "유산/임신/낙태", x좌표, y좌표]],
  "relations": [[id1, id2, "관계설명"]]
}

## 좌표 배치 규칙 (핵심!)

### 객체 및 선 크기 상수 ⚠️ 매우 중요!
- **객체 크기**: 60x60 px
- **파트너선 (U자 형태)**:
  - 가로선 Y = 부부 중 낮은 Y + 60
  - 자녀는 이 가로선 아래에 연결됨
- **최소 간격**: 객체 간 90px (X축), 세대 간 150px (Y축)
- **그리드**: 모든 좌표는 30n + 15 형식 (예: 15, 45, 75, 105...)

### 핵심 규칙 4가지
1. **부부는 같은 Y, 남편이 왼쪽** - 남편 x < 아내 x (항상!)
2. **부부 간 최소 90px 간격** - 아내 x - 남편 x ≥ 90 (필수!)
3. **부부는 자녀를 X축으로 감싸야 함** - 아버지 x ≤ 최좌측자녀, 어머니 x ≥ 최우측자녀
4. **같은 Y의 부부들은 X축으로 분리** - 다음 부부의 시작 X > 이전 부부의 끝 X + 90

### Y 좌표 계산 (부부별 고유 Y) ⚠️ 핵심!

**원리**: 각 부부가 세대 범위 내에서 고유한 Y를 가지면:
- 파트너선이 자녀만 감싸면 됨 (X축에서만 조절)
- 다른 부부의 자녀와 Y가 달라 겹치지 않음
- 연장자 우선 왼쪽 정렬 기준 유지 가능

**세대별 기준 Y**:
- 조부모: -285 (범위: ±60)
- 부모: -135 (범위: ±60)
- 본인(IP): 15 (범위: ±60)
- 자녀: 165 (범위: ±60)
- 손자녀: 315 (범위: ±60)

**부부별 Y 할당 규칙**:
1. 같은 세대 내 첫 번째 부부: 기준 Y (예: 15)
2. 두 번째 부부: 기준 Y + 60 (예: 75) 또는 기준 Y - 60 (예: -45)
3. 부부의 자녀 Y = 부모 Y + 90 (파트너선 가로선 Y + 30)

**예시 (본인 세대에 부부 2쌍)**:
- IP 부부: y=15, IP 자녀들: y=105
- 시동생 부부: y=75, 시동생 자녀들: y=165
→ 두 부부의 자녀가 다른 Y에 있어 겹치지 않음!

### X 좌표 배치 ⚠️ 매우 중요!

**핵심 규칙**:
1. **부부 간 최소 90px 간격**: 남편 x와 아내 x 차이는 최소 90px 이상!
2. **같은 Y의 부부들은 X축에서 겹치면 안됨**: 다음 부부의 minX > 이전 부부의 maxX + 90
3. **연장자 우선 왼쪽 정렬** (birthOrder순): 첫째 왼쪽, 막내 오른쪽, 형제 간 90px 간격

**부부 간 X 간격 예시** ⚠️:
- ❌ 잘못됨: 남편 x=75, 아내 x=105 (간격 30px)
- ✓ 올바름: 남편 x=75, 아내 x=165 (간격 90px 이상)

**같은 Y에 부부 2쌍 배치 예시** ⚠️:
- 부부1: 남편 x=45, 아내 x=135 (범위: 45~135)
- 부부2: 남편 x=225, 아내 x=315 (범위: 225~315)
- → 부부2의 시작(225) > 부부1의 끝(135) + 90 = 225 ✓

**부모가 자녀를 감싸는 계산**:
- 자녀들 X 범위: [childMinX, childMaxX]
- 아버지 x = childMinX - 45
- 어머니 x = childMaxX + 45
- 단, 부부 간 간격이 90px 미만이면 90px로 확장!

**예시 (자녀 3명)**:
- 첫째 x=105, 둘째 x=195, 셋째 x=285
- 아버지 x = 105 - 45 = 60
- 어머니 x = 285 + 45 = 330
- 부부 간격 = 330 - 60 = 270px ✓

### 간단한 배치 예시

**IP 부부 + 자녀 2명**:
- 자녀1: x=105, y=105
- 자녀2: x=195, y=105
- IP(남편): x=60, y=15
- 배우자(아내): x=240, y=15

**시부모 + 남편 + 시동생**:
- 남편: x=60, y=15
- 시동생: x=240, y=75 (다른 Y!)
- 시아버지: x=15, y=-135
- 시어머니: x=285, y=-135

### IP 성별에 따른 배치
- **IP 남성**: IP 왼쪽, 배우자 오른쪽 / IP 형제는 IP 왼쪽
- **IP 여성**: 배우자 왼쪽, IP 오른쪽 / IP 형제는 IP 오른쪽

## subjects 규칙
- id: 숫자 1부터 시작 (내담자는 반드시 id=1)
- type: "PERSON" 고정 (⚠️ 유산/임신/낙태는 subjects에 포함하지 말고 fetus 배열에만 추가)
- gender: "Male", "Female", "Gay", "Lesbian", "Transgender_Male", "Transgender_Female", "Nonbinary" 중 하나
- isIP: 내담자만 true
- isDead: 사망자는 true
- illness: 심리적/신체적 문제가 언급된 경우 아래 중 하나 선택:
  - "None" (기본값)
  - "Psychological_Or_Physical_Problem" (심리적/신체적 문제)
  - "Alcohol_Or_Drug_Abuse" (알코올/약물 남용)
  - "Suspected_Alcohol_Or_Drug_Abuse" (알코올/약물 남용 의심)
  - "Psychological_Or_Physical_Illness_In_Remission" (심리적/신체적 질병 관해)
  - "In_Recovery_From_Substance_Abuse" (물질 남용 회복 중)
  - "Serious_Mental_Or_Physical_Problems_And_Substance_Abuse" (심각한 정신/신체 문제 + 물질 남용)
- size: 다음 기준에 따라 결정
  - **"SMALL"**: 관계만 언급되고 구체적 정보가 없는 인물
    - 예: "형의 아내가 있다", "첫째가 결혼했다" → 배우자 존재만 언급
    - 예: "아버지의 형제가 있다" → 존재만 언급
  - **"DEFAULT"**: 구체적인 정보(이름, 나이, 직업, 성격, 사건 등)가 하나라도 있는 인물
- birthOrder: 형제 중 출생 순서 (1=첫째, 2=둘째...). 알 수 없으면 추정값 사용
- **spouseId**: 배우자가 있는 경우 배우자의 id (⚠️ 부부는 반드시 쌍으로 연결!)

### 구조화된 속성 (attribute 필드로 분리) ⚠️ 중요!
다음 정보는 memo가 아닌 별도 속성으로 추출:
- **birthYear**: 출생년도 (예: 2000, 1975) - "2000년생", "75년생" 등에서 추출
- **age**: 나이 (숫자) - "25세", "30대 초반" 등에서 추출 (범위일 경우 중간값)
- **job**: 직업 (문자열) - "회사원", "교사", "주부" 등
- **education**: 학력 (문자열) - "대졸", "고졸", "대학원" 등
- **region**: 거주지역 (문자열) - "서울", "부산" 등

### memo 규칙 ⚠️
memo에는 위 속성으로 분리할 수 없는 **서술적 정보만** 포함:
- 성격, 행동 패턴, 관계 특성
- 중요한 생애 사건 (위 속성에 해당하지 않는 것)
- 상담에서 언급된 특이사항
- ❌ 나이, 출생년도, 직업, 학력, 지역 정보는 memo에 넣지 말 것!

**예시:**
- 입력: "2000년생, 서울 거주, 회사원, 알코올 의존증 치료 중"
- 올바른 출력:
  - birthYear: 2000
  - job: "회사원"
  - region: "서울"
  - illness: "Alcohol_Or_Drug_Abuse"
  - memo: "알코올 의존증 치료 중"
- ❌ 잘못된 출력:
  - memo: "2000년생, 서울 거주, 회사원, 알코올 의존증 치료 중"

### 관계만 언급된 인물 처리 ⚠️
배우자나 가족 존재만 언급되고 구체적 정보가 없는 경우:
- **반드시 subjects에 추가** (couples/children 연결을 위해 필요)
- size: "SMALL"
- name: 관계로 표기 (예: "형의 아내", "첫째의 배우자")
- memo: null 또는 짧은 관계 설명

**예시:**
- 입력: "형이 결혼했다" (형의 배우자 정보 없음)
- 출력: { id: 5, type: "PERSON", gender: "Female", name: "형의 아내", isIP: false, size: "SMALL", spouseId: 4, x: -45, y: 15 }
- ❌ 잘못된 출력: 배우자를 subjects에서 누락

### 임의 부모 생성 규칙 ⚠️ 매우 중요!

**형제자매는 반드시 부모를 통해 연결해야 함!**
- 형제자매끼리 직접 연결하지 않음
- 부모가 언급되지 않아도 임의의 부모를 생성하여 children 배열로 연결

**부모 쌍 완성 규칙:**
- 어머니만 언급된 경우 → 아버지도 생성 (size: "SMALL", name: "[자녀명] 아버지")
- 아버지만 언급된 경우 → 어머니도 생성 (size: "SMALL", name: "[자녀명] 어머니")
- 부모가 둘 다 언급되지 않은 형제자매 → 부모 둘 다 생성

**예시 1: 형제자매가 있지만 부모 언급 없음**
- 입력: "IP에게 형이 있다"
- 출력:
  - IP 아버지 (id: 10, size: "SMALL", name: "IP 아버지")
  - IP 어머니 (id: 11, size: "SMALL", name: "IP 어머니")
  - couples: [[10, 11, "marriage"]]
  - children: [[10, 11, 1, "biological"], [10, 11, 2, "biological"]] (IP와 형)

**예시 2: 어머니만 언급됨**
- 입력: "어머니가 요양원에 계신다" (아버지 언급 없음)
- 출력:
  - 어머니 (id: 5, name: "어머니", size: "DEFAULT", memo: "요양원에 계심")
  - 아버지 (id: 6, name: "IP 아버지", size: "SMALL") ← 임의 생성!
  - couples: [[6, 5, "marriage"]]
  - children: [[6, 5, 1, "biological"]]

**예시 3: 배우자 형제자매 (좌표 보정 포함!)** ⚠️ 중요
- 입력: "아내에게 언니가 있다" (배우자 x=330)
- 출력:
  - 언니 (id: 15, x=420, y=-15) ← 배우자 오른쪽
  - 배우자 아버지 (id: 20, size: "SMALL", x=285, y=-135) ← min(330, 420) - 45 = 285
  - 배우자 어머니 (id: 21, size: "SMALL", x=465, y=-135) ← max(330, 420) + 45 = 465
  - couples: [[20, 21, "marriage"]]
  - children: [[20, 21, 배우자id], [20, 21, 언니id]]
  - ✓ 부모 x범위 [285, 465]가 배우자+언니 [330, 420] 감쌈

## couples 규칙 ⚠️ 부부 쌍 필수!
- 형식: [남편id, 아내id, 상태, memo?]
- 상태: "marriage"(기본), "divorced", "separated", "cohabiting"
- memo: 부부 관계에 대한 추가 설명 (선택, 예: "결혼 30년", "재혼", "별거 중")
- **모든 배우자 관계는 couples 배열에 반드시 등록**
- 부부는 subjects에서 spouseId로 서로 연결 + couples 배열에도 등록
- 동성 커플: 둘 다 같은 성별이어도 couples에 등록 (순서는 나이순 또는 먼저 언급된 순)

## children 규칙
- 형식: [아버지id, 어머니id, 자녀id, 상태, memo?]
- 상태: "biological"(기본), "adopted", "foster"
- memo: 부모-자녀 관계에 대한 추가 설명 (선택, 예: "늦둥이", "아버지와 갈등")
- **자녀id는 birthOrder 순서대로 나열** (첫째부터)

## fetus 규칙
- 형식: [아버지id, 어머니id, 상태설명, x좌표, y좌표]
- x좌표는 같은 부모의 다른 자녀들 오른쪽에 배치 (예: 막내자녀 x + 90)
- ⚠️ **y좌표는 어느 부부의 자녀인지에 따라 다름!**
  - **IP 부부의 Fetus**: y=135~195 (자녀 세대)
  - **IP 부모의 Fetus**: y=-15~45 (본인 세대, IP의 형제와 동일)
  - **배우자 부모의 Fetus**: y=-15~45 (본인 세대, 배우자의 형제와 동일)
  - **조부모의 Fetus**: y=-165~-105 (부모 세대)
- ⚠️ **주의: fetus는 subjects 배열에 PERSON으로 추가하지 말 것!** fetus 배열에만 추가

## relations 규칙
- 형식: [id1, id2, 관계설명]
- 감정적 관계만: 친밀, 갈등, 소원, 적대, 단절 등
- 구조적 관계(형제, 부모, 자녀)는 포함하지 말 것

## 입력 (상담 축어록)
{transcripts}

JSON만 출력.`;

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의 - AI 출력용 (좌표 포함 스키마)
// ─────────────────────────────────────────────────────────────────────────────

// 부부 관계 타입 (AI 출력용)
type AICoupleStatus =
  | 'marriage' // 결혼
  | 'divorced' // 이혼
  | 'separated' // 별거
  | 'cohabiting' // 동거
  | 'engaged'; // 약혼

// 자녀 관계 타입 (AI 출력용)
type AIChildStatus =
  | 'biological' // 친자녀
  | 'adopted' // 입양
  | 'foster'; // 위탁

/**
 * Fetus 엔트리 타입 (후처리에서 좌표가 추가될 수 있음)
 */
type AIFetusEntry =
  | [number | null, number | null, string] // 기본: [fatherId, motherId, status]
  | [number | null, number | null, string, number, number]; // 보정 후: [fatherId, motherId, status, x, y]

/**
 * AI가 출력하는 가계도 데이터 (좌표 포함)
 * - subjects: 숫자 ID 기반의 구성원 배열 (좌표 포함)
 * - couples: [부id, 처id, 상태?] 형태의 튜플 배열
 * - children: [부id, 모id, 자녀id, 상태?] 형태의 튜플 배열
 * - fetus: [부id, 모id, 상태설명] 형태의 튜플 배열
 * - relations: [id1, id2, "관계설명"] 형태의 튜플 배열
 */
interface AIGenogramOutput {
  subjects: AISubject[];
  couples: [number, number, AICoupleStatus?, string?][]; // [husbandId, wifeId, status?, memo?]
  children: [number | null, number | null, number, AIChildStatus?, string?][]; // [fatherId, motherId, childId, status?, memo?]
  fetus: AIFetusEntry[]; // [fatherId, motherId, status, x?, y?]
  relations: [number, number, string][]; // [id1, id2, description]
}

interface AISubject {
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
// 타입 정의 - 캔버스 SerializedGenogram 형식
// ─────────────────────────────────────────────────────────────────────────────

interface SerializedGenogram {
  id: string;
  version: string;
  metadata: {
    title: string;
    createdAt: Date;
    updatedAt: Date;
  };
  subjects: CanvasSubject[];
  connections: CanvasConnection[];
  annotations: CanvasAnnotation[];
  view: {
    viewPoint: { center: { x: number; y: number }; zoom: number };
    visibility: {
      name: boolean;
      age: boolean;
      birthDate: boolean;
      deathDate: boolean;
      extraInfo: boolean;
      illness: boolean;
      relationLine: boolean;
      groupLine: boolean;
      grid: boolean;
      memo: boolean;
    };
  };
}

interface CanvasSubject {
  id: string;
  entity: {
    type: string;
    attribute: PersonAttribute | AnimalAttribute | FetusAttribute;
    memo: string | null;
  };
  layout: {
    center: { x: number; y: number };
    style: {
      size: string;
      bgColor: string;
      textColor: string;
    };
  };
}

interface PersonAttribute {
  gender: string;
  name: string | null;
  isIP: boolean;
  isDead: boolean;
  lifeSpan: { birth: string | null; death: string | null };
  age: number | null;
  illness: string;
  extraInfo: {
    enable: boolean;
    job: string | null;
    education: string | null;
    region: string | null;
  };
}

interface AnimalAttribute {
  name: string | null;
  isDead: boolean;
}

interface FetusAttribute {
  status: 'Miscarriage' | 'Abortion' | 'Pregnancy';
}

interface CanvasConnection {
  id: string;
  entity: {
    type: string;
    attribute: Record<string, unknown>;
    memo: string | null;
  };
  layout: {
    strokeWidth: string;
    strokeColor: string;
    textColor: string;
  };
}

interface CanvasAnnotation {
  id: string;
  text: string;
  layout: {
    center: { x: number; y: number };
    style: {
      size: string;
      bgColor: string;
      textColor: string;
      borderStyle: string;
      borderColor: string;
    };
  };
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
    family_summary: string;
    genogram: SerializedGenogram;
    stats: {
      total_transcripts: number;
      newly_summarized: number;
      from_cache: number;
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
  family_summary: string | null;
  source_table: 'transcribes' | 'handwritten_transcribes';
}

interface ClientInfo {
  userId: number;
  familySummary: string | null;
}

interface CacheCheckResult {
  isValid: boolean;
  cachedGenogram: SerializedGenogram | null;
  cachedFamilySummary: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM 호출 함수
// ─────────────────────────────────────────────────────────────────────────────

const GPT_MODEL = 'gpt-4.1-2025-04-14';

/**
 * GPT-4.1을 사용한 JSON 생성 (정밀한 구조화 작업용)
 */
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
    // JSON 블록 추출 시도
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    throw new Error(`JSON 파싱 실패: ${content.substring(0, 500)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 레이아웃 유틸리티 함수
// ─────────────────────────────────────────────────────────────────────────────

function snapToGrid(value: number): number {
  const n = Math.round((value - 15) / GRID_SIZE);
  return n * GRID_SIZE + 15;
}

// getYPositionByGeneration은 convertAIOutputToCanvas 내에서 getY로 대체됨

function generateId(prefix: string): string {
  const timestamp = Date.now();
  const uuid = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${uuid}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸리티 함수 - 연도 정규화
// ─────────────────────────────────────────────────────────────────────────────

/**
 * YYYY 형식의 연도를 YYYYMMDD 형식으로 변환
 */
function normalizeYearToDate(
  year: number | string | null | undefined
): string | null {
  if (year === null || year === undefined) return null;

  const yearStr = String(year).trim();
  if (!yearStr) return null;

  if (/^\d{8}$/.test(yearStr)) return yearStr;
  if (/^\d{4}$/.test(yearStr)) return `${yearStr}0101`;

  const numYear = Number(yearStr);
  if (!isNaN(numYear) && numYear >= 1000 && numYear <= 9999) {
    return `${numYear}0101`;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 상태 → 캔버스 상태 변환 (매핑 함수들)
// ─────────────────────────────────────────────────────────────────────────────

function mapGender(aiGender?: AISubject['gender']): string {
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

function mapIllness(aiIllness?: AISubject['illness']): string {
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

function mapPartnerStatus(status?: AICoupleStatus): string {
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

function mapChildStatus(status?: AIChildStatus): string {
  switch (status) {
    case 'adopted':
      return ParentChildStatus.Adopted_Child;
    case 'foster':
      return ParentChildStatus.Foster_Child;
    default:
      return ParentChildStatus.Biological_Child;
  }
}

function mapFetusStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy')) {
    return FetusStatus.Pregnancy;
  }
  if (lower.includes('낙태') || lower.includes('abortion')) {
    return FetusStatus.Abortion;
  }
  return FetusStatus.Miscarriage;
}

function mapFetusToChildStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('임신') || lower.includes('pregnancy')) {
    return ParentChildStatus.Pregnancy;
  }
  if (lower.includes('낙태') || lower.includes('abortion')) {
    return ParentChildStatus.Abortion;
  }
  return ParentChildStatus.Miscarriage;
}

function mapRelationStatus(description: string): string {
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
// 좌표 후처리 보정 - 세대 기반 트리 레이아웃
// ─────────────────────────────────────────────────────────────────────────────

// 좌표 상수
const Y_GENERATION_GAP = 150; // 세대 간 Y 간격
const X_SIBLING_GAP = 90; // 형제 간 X 간격
const X_TREE_GAP = 180; // 트리 간 X 간격
const MIN_COUPLE_GAP = 90; // 부부 간 최소 X 간격

interface TreeLayoutResult {
  minX: number;
  maxX: number;
  positions: Map<number, { x: number; y: number }>;
}

/**
 * 세대 기반 트리 레이아웃 알고리즘
 *
 * 핵심 원칙:
 * 1. 독립된 가족 트리 식별 (IP 원가족, 배우자 원가족)
 * 2. 각 트리의 루트 부부(최상위 세대)를 찾기
 * 3. 트리 내에서 Y축으로 세대별 배치 (루트=0, 자녀=150, 손자녀=300...)
 * 4. 각 트리를 X축으로 나란히 배치 (IP 원가족 왼쪽, 배우자 원가족 오른쪽)
 */
function postProcessCoordinates(aiOutput: AIGenogramOutput): AIGenogramOutput {
  const output: AIGenogramOutput = JSON.parse(JSON.stringify(aiOutput));

  // 0. 기본 맵 구축
  const subjectById = new Map<number, AISubject>();
  for (const s of output.subjects || []) {
    subjectById.set(s.id, s);
  }

  // 1. 부모-자녀 관계 맵 구축
  const coupleToChildren = new Map<string, number[]>();
  const childToParents = new Map<number, { fatherId: number | null; motherId: number | null }>();

  for (const [fatherId, motherId, childId] of output.children || []) {
    const key = `${fatherId}-${motherId}`;
    if (!coupleToChildren.has(key)) {
      coupleToChildren.set(key, []);
    }
    coupleToChildren.get(key)!.push(childId);
    childToParents.set(childId, { fatherId, motherId });
  }

  // 2. 배우자 관계 맵
  const spouseMap = new Map<number, number>();
  for (const [husbandId, wifeId] of output.couples || []) {
    spouseMap.set(husbandId, wifeId);
    spouseMap.set(wifeId, husbandId);
  }

  // 3. 특정 사람이 속한 가족 트리의 루트 부부 찾기
  const findTreeRoot = (personId: number): { husbandId: number; wifeId: number } | null => {
    const visited = new Set<number>();
    let current = personId;

    while (!visited.has(current)) {
      visited.add(current);

      // 부모가 있으면 올라가기
      const parents = childToParents.get(current);
      if (parents) {
        if (parents.fatherId) {
          current = parents.fatherId;
          continue;
        }
        if (parents.motherId) {
          current = parents.motherId;
          continue;
        }
      }

      // 더 이상 올라갈 수 없음 - 현재 위치가 루트
      const spouseId = spouseMap.get(current);
      if (spouseId !== undefined) {
        const husband = subjectById.get(current);
        const wife = subjectById.get(spouseId);
        if (husband && wife) {
          if (husband.gender === 'Male') {
            return { husbandId: current, wifeId: spouseId };
          } else {
            return { husbandId: spouseId, wifeId: current };
          }
        }
      }
      break;
    }

    return null;
  };

  // 4. 트리 레이아웃 계산 (DFS로 하위 트리 배치)
  const layoutTree = (
    rootHusbandId: number,
    _rootWifeId: number,
    startX: number,
    startY: number
  ): TreeLayoutResult => {
    const positions = new Map<number, { x: number; y: number }>();
    let minX = Infinity;
    let maxX = -Infinity;

    // 자녀 목록 가져오기
    const getChildren = (id1: number, id2: number): number[] => {
      const key1 = `${id1}-${id2}`;
      const key2 = `${id2}-${id1}`;
      return [
        ...(coupleToChildren.get(key1) || []),
        ...(coupleToChildren.get(key2) || []),
      ];
    };

    // 배치 (재귀)
    const placeNode = (personId: number, x: number, y: number): number => {
      const subject = subjectById.get(personId);
      if (!subject) return x;

      const spouseId = spouseMap.get(personId);

      if (spouseId === undefined) {
        // 미혼자
        positions.set(personId, { x, y });
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        return x + X_SIBLING_GAP;
      }

      // 부부인 경우
      const children = getChildren(personId, spouseId);

      if (children.length === 0) {
        // 자녀 없는 부부
        const husband = subjectById.get(personId);
        const wife = subjectById.get(spouseId);

        if (husband && wife) {
          const hX = husband.gender === 'Male' ? x : x + MIN_COUPLE_GAP;
          const wX = husband.gender === 'Male' ? x + MIN_COUPLE_GAP : x;
          positions.set(personId, { x: hX, y });
          positions.set(spouseId, { x: wX, y });
          minX = Math.min(minX, hX, wX);
          maxX = Math.max(maxX, hX, wX);
        }
        return x + MIN_COUPLE_GAP + X_SIBLING_GAP;
      }

      // 자녀 있는 부부
      // 먼저 자녀들 배치
      const childY = y + Y_GENERATION_GAP;
      let childX = x;
      const childPositions: number[] = [];

      // birthOrder로 정렬
      const sortedChildren = [...children].sort((a, b) => {
        const aSubject = subjectById.get(a);
        const bSubject = subjectById.get(b);
        return (aSubject?.birthOrder ?? 999) - (bSubject?.birthOrder ?? 999);
      });

      for (const childId of sortedChildren) {
        childPositions.push(childX);
        childX = placeNode(childId, childX, childY);
      }

      // 부모는 자녀들의 중앙에 배치
      const childMinX = Math.min(...childPositions);
      const childMaxX = childX - X_SIBLING_GAP;

      const husband = subjectById.get(personId);
      const wife = subjectById.get(spouseId);

      if (husband && wife) {
        const husbandX = childMinX - 45;
        const wifeX = childMaxX + 45;

        // 부부 간 최소 간격 보장
        const gap = wifeX - husbandX;
        if (gap < MIN_COUPLE_GAP) {
          const center = (husbandX + wifeX) / 2;
          positions.set(personId, { x: husband.gender === 'Male' ? center - MIN_COUPLE_GAP / 2 : center + MIN_COUPLE_GAP / 2, y });
          positions.set(spouseId, { x: husband.gender === 'Male' ? center + MIN_COUPLE_GAP / 2 : center - MIN_COUPLE_GAP / 2, y });
        } else {
          positions.set(personId, { x: husband.gender === 'Male' ? husbandX : wifeX, y });
          positions.set(spouseId, { x: husband.gender === 'Male' ? wifeX : husbandX, y });
        }

        const finalHusbandX = positions.get(personId)!.x;
        const finalWifeX = positions.get(spouseId)!.x;
        minX = Math.min(minX, finalHusbandX, finalWifeX);
        maxX = Math.max(maxX, finalHusbandX, finalWifeX);
      }

      return childX;
    };

    // 루트 부부부터 시작
    placeNode(rootHusbandId, startX, startY);

    return { minX, maxX, positions };
  };

  // 6. IP와 배우자의 원가족 트리 찾기
  const ip = output.subjects?.find((s) => s.isIP);
  if (!ip) return output;

  const ipTreeRoot = findTreeRoot(ip.id);
  const ipSpouseId = spouseMap.get(ip.id);
  const spouseTreeRoot = ipSpouseId ? findTreeRoot(ipSpouseId) : null;

  // 7. 두 트리가 다른지 확인 (같은 트리면 하나만 레이아웃)
  const isSameTree = ipTreeRoot && spouseTreeRoot &&
    ipTreeRoot.husbandId === spouseTreeRoot.husbandId &&
    ipTreeRoot.wifeId === spouseTreeRoot.wifeId;

  // 8. 트리별 레이아웃 계산
  let currentX = 15;
  const allPositions = new Map<number, { x: number; y: number }>();

  if (ipTreeRoot) {
    const ipTreeLayout = layoutTree(ipTreeRoot.husbandId, ipTreeRoot.wifeId, currentX, 15);
    for (const [id, pos] of Array.from(ipTreeLayout.positions.entries())) {
      allPositions.set(id, pos);
    }
    currentX = ipTreeLayout.maxX + X_TREE_GAP;
  }

  if (spouseTreeRoot && !isSameTree) {
    const spouseTreeLayout = layoutTree(spouseTreeRoot.husbandId, spouseTreeRoot.wifeId, currentX, 15);
    for (const [id, pos] of Array.from(spouseTreeLayout.positions.entries())) {
      allPositions.set(id, pos);
    }
  }

  // 9. 위치 적용
  for (const [id, pos] of Array.from(allPositions.entries())) {
    const subject = subjectById.get(id);
    if (subject) {
      subject.x = snapToGrid(pos.x);
      subject.y = snapToGrid(pos.y);
    }
  }

  // 10. 레이아웃에 포함되지 않은 사람들 처리 (고아 노드)
  const layouttedIds = new Set(allPositions.keys());
  let orphanX = currentX;

  for (const subject of output.subjects || []) {
    if (!layouttedIds.has(subject.id)) {
      subject.x = snapToGrid(orphanX);
      subject.y = snapToGrid(15);
      orphanX += X_SIBLING_GAP;
    }
  }

  // 11. Fetus 좌표 처리
  for (let i = 0; i < (output.fetus?.length ?? 0); i++) {
    const fetus = output.fetus![i];
    const [fatherId, motherId, status] = fetus;

    const father = fatherId != null ? subjectById.get(fatherId) : null;
    const mother = motherId != null ? subjectById.get(motherId) : null;

    let fetusX = 15;
    let fetusY = Y_GENERATION_GAP;

    if (father && mother) {
      fetusX = (father.x + mother.x) / 2;
      fetusY = Math.max(father.y, mother.y) + Y_GENERATION_GAP;
    } else if (father) {
      fetusX = father.x + 90;
      fetusY = father.y + Y_GENERATION_GAP;
    } else if (mother) {
      fetusX = mother.x + 90;
      fetusY = mother.y + Y_GENERATION_GAP;
    }

    output.fetus![i] = [fatherId, motherId, status, snapToGrid(fetusX), snapToGrid(fetusY)];
  }

  // 12. 좌표 정규화 (최소 X를 15로)
  let globalMinX = Infinity;
  for (const subject of output.subjects || []) {
    globalMinX = Math.min(globalMinX, subject.x);
  }
  for (const fetus of output.fetus || []) {
    if (fetus.length === 5) {
      globalMinX = Math.min(globalMinX, fetus[3]);
    }
  }

  if (globalMinX !== Infinity && globalMinX !== 15) {
    const shift = 15 - globalMinX;
    for (const subject of output.subjects || []) {
      subject.x = snapToGrid(subject.x + shift);
    }
    for (let i = 0; i < (output.fetus?.length ?? 0); i++) {
      const fetus = output.fetus![i];
      if (fetus.length === 5) {
        output.fetus![i] = [fetus[0], fetus[1], fetus[2], snapToGrid(fetus[3] + shift), fetus[4]];
      }
    }
  }

  return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 출력 → 캔버스 형식 변환
// ─────────────────────────────────────────────────────────────────────────────

function convertAIOutputToCanvas(aiOutput: AIGenogramOutput): {
  subjects: CanvasSubject[];
  connections: CanvasConnection[];
} {
  // 좌표 후처리 보정 적용
  const correctedOutput = postProcessCoordinates(aiOutput);

  const subjects: CanvasSubject[] = [];
  const connections: CanvasConnection[] = [];

  // AI 숫자 ID → 실제 ID 매핑
  const idMap = new Map<number, string>();

  // PERSON subjects 처리
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
          } satisfies PersonAttribute,
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

  // Fetus subjects 처리
  const fetusIdMap = new Map<string, string>();
  let fetusIndex = 0;

  for (const fetusData of correctedOutput.fetus || []) {
    const fatherId = fetusData[0];
    const motherId = fetusData[1];
    const status = fetusData[2];
    const correctedX = fetusData[3] as number | undefined;
    const correctedY = fetusData[4] as number | undefined;

    const key = `${fatherId}-${motherId}-${fetusIndex++}`;
    const realId = generateId('fetus');
    fetusIdMap.set(key, realId);

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
        } as FetusAttribute,
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
  fetusIndex = 0;
  for (const [fatherId, motherId, status] of aiOutput.fetus || []) {
    const key = `${fatherId}-${motherId}-${fetusIndex++}`;
    const realFetusId = fetusIdMap.get(key);
    if (!realFetusId) continue;

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

  return { subjects, connections };
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
    .select('id, session_id, parsed_text, contents, family_summary')
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
          family_summary: t.family_summary,
          source_table: 'transcribes',
        });
      }
    }
  }

  const { data: handwrittenData, error: handwrittenError } = await supabase
    .from('handwritten_transcribes')
    .select('id, session_id, contents, family_summary')
    .in('session_id', sessionIds);

  if (!handwrittenError && handwrittenData) {
    for (const t of handwrittenData) {
      if (t.contents?.trim()) {
        transcripts.push({
          id: t.id,
          session_id: t.session_id,
          contents: t.contents,
          family_summary: t.family_summary,
          source_table: 'handwritten_transcribes',
        });
      }
    }
  }

  return transcripts;
}

async function getClientInfo(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientInfo> {
  const { data, error } = await supabase
    .from('clients')
    .select('counselor_id, family_summary')
    .eq('id', clientId)
    .single();

  if (error || !data) {
    throw new Error(`클라이언트 조회 실패: ${error?.message}`);
  }

  return {
    userId: data.counselor_id,
    familySummary: data.family_summary,
  };
}

async function getExistingGenogram(
  supabase: SupabaseClient,
  clientId: string
): Promise<SerializedGenogram | null> {
  const { data, error } = await supabase
    .from('genograms')
    .select('data')
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.data as SerializedGenogram;
}

async function checkCache(
  supabase: SupabaseClient,
  clientId: string,
  transcripts: TranscriptInfo[],
  clientFamilySummary: string | null
): Promise<CacheCheckResult> {
  const hasAllTranscriptSummaries = transcripts.every(
    (t) => t.family_summary !== null && t.family_summary !== ''
  );

  const hasClientFamilySummary =
    clientFamilySummary !== null && clientFamilySummary !== '';

  const cachedGenogram = await getExistingGenogram(supabase, clientId);
  const hasGenogram = cachedGenogram !== null;

  const isValid =
    hasAllTranscriptSummaries && hasClientFamilySummary && hasGenogram;

  return {
    isValid,
    cachedGenogram,
    cachedFamilySummary: clientFamilySummary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Genogram JSON 생성 (축어록에서 직접 생성)
// ─────────────────────────────────────────────────────────────────────────────

async function convertTranscriptsToGenogram(
  transcripts: TranscriptInfo[]
): Promise<SerializedGenogram> {
  console.log(`[convertTranscriptsToGenogram] START`);
  console.log(
    `[convertTranscriptsToGenogram] transcripts count: ${transcripts.length}`
  );

  const now = new Date();

  const defaultGenogram: SerializedGenogram = {
    id: generateId('genogram'),
    version: 'v1',
    metadata: {
      title: 'AI 생성 가계도',
      createdAt: now,
      updatedAt: now,
    },
    subjects: [],
    connections: [],
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

  if (transcripts.length === 0) {
    console.log(
      `[convertTranscriptsToGenogram] No transcripts, returning default`
    );
    return defaultGenogram;
  }

  // 모든 축어록을 하나의 텍스트로 합치기
  const allTranscriptsText = transcripts
    .map((t, i) => `[세션 ${i + 1}]\n${t.contents}`)
    .join('\n\n---\n\n');

  console.log(
    `[convertTranscriptsToGenogram] Combined transcripts length: ${allTranscriptsText.length}`
  );

  console.log(`[convertTranscriptsToGenogram] Calling GPT for JSON...`);
  const prompt = GENOGRAM_JSON_PROMPT.replace(
    '{transcripts}',
    allTranscriptsText
  );
  const aiOutput = await callGPTForJSON<AIGenogramOutput>(prompt);

  console.log(`[convertTranscriptsToGenogram] GPT returned AI output`);
  console.log(
    `[convertTranscriptsToGenogram] AI output summary: ` +
      `subjects=${aiOutput.subjects?.length ?? 0}, ` +
      `couples=${aiOutput.couples?.length ?? 0}, ` +
      `children=${aiOutput.children?.length ?? 0}, ` +
      `fetus=${aiOutput.fetus?.length ?? 0}, ` +
      `relations=${aiOutput.relations?.length ?? 0}`
  );

  const { subjects, connections } = convertAIOutputToCanvas(aiOutput);

  console.log(
    `[convertTranscriptsToGenogram] DONE: subjects=${subjects.length}, connections=${connections.length}`
  );

  return {
    ...defaultGenogram,
    subjects,
    connections,
  };
}

async function saveGenogram(
  supabase: SupabaseClient,
  clientId: string,
  userId: number,
  genogram: SerializedGenogram
): Promise<void> {
  const { error } = await supabase
    .from('genograms')
    .upsert(
      {
        client_id: clientId,
        user_id: userId,
        data: genogram,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'client_id',
      }
    )
    .select();

  if (error) {
    throw new Error(`genograms 저장 실패: ${error.message}`);
  }
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
    console.log('[genogram/summary] 잘못된 메서드:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[genogram/summary] 인증 토큰 없음');
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
  console.log('[genogram/summary] Supabase 클라이언트 생성 완료');

  try {
    const body = req.body as GenerateFamilySummaryRequest;
    console.log('[genogram/summary] 요청 바디:', {
      client_id: body.client_id,
      force_refresh: body.force_refresh,
    });

    // 입력 검증
    if (!body.client_id) {
      console.log('[genogram/summary] client_id 누락');
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'client_id가 필요합니다.',
        },
      } satisfies GenerateFamilySummaryResponse);
      return;
    }

    const forceRefresh = body.force_refresh ?? false;

    // 클라이언트 정보 조회
    console.log('[genogram/summary] 클라이언트 정보 조회 시작');
    const clientInfo = await getClientInfo(supabase, body.client_id);
    console.log('[genogram/summary] 클라이언트 정보 조회 완료:', {
      userId: clientInfo.userId,
      hasFamilySummary: !!clientInfo.familySummary,
    });

    // 축어록 조회
    console.log('[genogram/summary] 축어록 조회 시작');
    const transcripts = await getClientTranscripts(supabase, body.client_id);
    console.log('[genogram/summary] 축어록 조회 완료:', {
      count: transcripts.length,
    });

    if (transcripts.length === 0) {
      console.log('[genogram/summary] 축어록 없음');
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_TRANSCRIPTS',
          message: '연결된 축어록이 없습니다.',
        },
      } satisfies GenerateFamilySummaryResponse);
      return;
    }

    // 캐시 확인 (force_refresh가 아닐 때)
    if (!forceRefresh) {
      console.log('[genogram/summary] 캐시 확인 시작');
      const cache = await checkCache(
        supabase,
        body.client_id,
        transcripts,
        clientInfo.familySummary
      );
      console.log('[genogram/summary] 캐시 확인 완료:', {
        isValid: cache.isValid,
      });

      if (cache.isValid && cache.cachedGenogram && cache.cachedFamilySummary) {
        console.log('[genogram/summary] 캐시 히트 - 캐시된 데이터 반환');
        res.status(200).json({
          success: true,
          data: {
            client_id: body.client_id,
            family_summary: cache.cachedFamilySummary,
            genogram: cache.cachedGenogram,
            stats: {
              total_transcripts: transcripts.length,
              newly_summarized: 0,
              from_cache: transcripts.length,
            },
          },
        } satisfies GenerateFamilySummaryResponse);
        return;
      }
    }

    // 축어록에서 직접 가계도 JSON 생성 (단순화된 파이프라인)
    console.log('[genogram/summary] 가계도 JSON 직접 생성 시작');
    const genogram = await convertTranscriptsToGenogram(transcripts);
    console.log('[genogram/summary] 가계도 JSON 생성 완료:', {
      subjectsCount: genogram.subjects.length,
      connectionsCount: genogram.connections.length,
    });

    // genograms 테이블에 저장
    console.log('[genogram/summary] genograms 테이블 저장 시작');
    await saveGenogram(supabase, body.client_id, clientInfo.userId, genogram);
    console.log('[genogram/summary] genograms 테이블 저장 완료');

    console.log('[genogram/summary] 성공 응답 반환');
    res.status(200).json({
      success: true,
      data: {
        client_id: body.client_id,
        family_summary: '', // 단순화된 파이프라인에서는 별도 요약 없음
        genogram,
        stats: {
          total_transcripts: transcripts.length,
          newly_summarized: transcripts.length,
          from_cache: 0,
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
