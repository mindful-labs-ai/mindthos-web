# 📐 Genogram Editor – System Design Document (SDD)

## 목적 (Purpose)

본 문서는 가계도(Genogram) 편집기의 데이터 구조 및 편집 로직을 정의한다.
본 시스템은 복잡한 가족·관계·정서·영향 관계를 트리 구조가 아닌 그래프(Graph) 기반으로 표현하며,
UI 상의 자동 레이아웃, 선택/편집/스타일 변경, 복합 커맨드 실행을 효율적으로 지원하는 것을 목표로 한다.

---

### 1. 핵심 설계 원칙 (Design Principles)

1. 모든 구성 요소는 Domain 과 Layout 분리
  • `entity`(데이터)와 `layout`(렌더링 정보) 분리된 객체지향모델
    • `entity`: 의미 모델. 데이터 자체의 의미 및 속성
    • `layout`: 표현 모델. UI 렌더링 및 배치 정보
  • layout은 domain을 참조하지만, domain은 layout에 의존하지 않음 (중요)

---

### 2. 전체 데이터 구조 개요

```
genogram:
  version: v1
  metadata:        # user_id, created_at, updated_at등 
  subjects:        # 노드 (Person, Animal)
  connections:     # 엣지 (관계선)
  annotation:      # 자유 주석 (텍스트 박스)
  view:            # 캔버스 상태
```


---

### 3. Subjects (노드)

3.1 개념
	•	캔버스에 직접 배치되는 모든 도형의 근원
	•	현재는 Person, Animal 지원
	•	향후 ShapeNode 등 확장 가능

3.2 SubjectType

```
SubjectType = 'Person' | 'Animal'
```

3.3 Subject 공통 구조

```
- id: UUID
  entity:
    type: SubjectType
    attribute: {...}   # 타입별 속성
    memo: string | null
  layout:
    center: { x: number, y: number }
    style:
      size: 'small' | 'default' | 'large'
      bgColor: string
      textColor: string
```

3.4 Person Attribute

```
Gender = 'Male' | 'Female' | 'Gay' | 'Lesbian' | 'TransMale' | 'TransFemale' | 'NonBinary'
```

```
ClinicStatus =
  | 'None'
  | 'PsychPhysicalProblem'
  | 'SubstanceAbuse'
  | 'SuspectedSubstanceAbuse'
  | 'RemissionPsychPhysical'
  | 'SubstanceRemissionWithProblem'
  | 'RecoveringSubstanceAbuse'
  | 'SevereMultipleProblems'
  | 'RecoveringMultipleProblems'
```

```
attribute:
  gender: Gender
  name: string | null
  isDead: boolean
  lifeSpan:
    birth: date | null
    death: date | null
  age: number | null
  clinicStatus: ClinicStatus
  detail:
    enable: boolean
    job: string | null
    education: string | null
    region: string | null
```


---

### 4. Connections (관계선 / 엣지)

4.1 개념
	•	Subjects 간의 관계, 영향, 그룹을 표현
	•	모두 선택/편집/스타일 변경 가능
	•	끝점이 어디인지(id)만 알면 UI 계산은 로직에서 처리

4.2 ConnectionType

```
ConnectionType =
  | 'Relation'
  | 'Influence'
  | 'Partner'
  | 'ParentChild'
  | 'Group'
```


---

4.3 Relation (정서 관계, 무방향)

```
RelationStatus =
  | 'Link'
  | 'Close'
  | 'Combination'
  | 'Estranged'
  | 'Hostility'
  | 'CloseHostility'
```

```
entity:
  type: Relation
  attribute:
    status: RelationStatus
    subjects: [subjectId, subjectId]
  memo: string | null
```


---

4.4 Influence (방향성 영향)

```
InfluenceStatus =
  | 'PhysicalAbuse'
  | 'MentalAbuse'
  | 'SexualAbuse'
  | 'Focus'
  | 'NegativeFocus'
```

```
entity:
  type: Influence
  attribute:
    status: InfluenceStatus
    startRef: subjectId
    endRef: subjectId
  memo: string | null
```

	•	화살표(arrow)는 UI에서 type === Influence 기준으로 자동 적용
	•	별도 arrow 속성 불필요

---

4.5 Partner (커플 / 결합)

```
PartnerStatus =
  | 'Married'
  | 'Separated'
  | 'Divorced'
  | 'Reunited'
  | 'Dating'
  | 'SecretDating'
```

```
entity:
  type: Partner
  attribute:
    status: PartnerStatus
    subjects: [subjectId, subjectId]
    detail:
      marriedDate?: string | null
      divorcedDate?: string | null
      reunitedDate?: string | null
  memo: string | null
```

	•	subjects는 배열 (일관성 + 확장성)
	•	실제 부모 역할은 ParentChild에서 참조

---

4.6 ParentChild (부모-자식)

```
ParentChildStatus =
  | 'Biological'
  | 'Miscarriage'
  | 'Abortion'
  | 'Twins'
  | 'IdenticalTwins'
  | 'AdoptedChild'
  | 'FosterChild'
```

```
entity:
  type: ParentChild
  attribute:
    status: ParentChildStatus
    parentRef: string   # subjectId 또는 partnerId (FK)
    childRef: string | [string, string]  # 단일 or 쌍둥이
  memo: string | null
```

	•	parentRef는 id 참조만 있으면 충분
	•	실제 선 위치/부모선 중앙 계산은 UI 로직에서 처리

---

4.7 Group (다자 관계)

```
entity:
  type: Group
  attribute:
    subjects: [subjectId, subjectId, ...]
  memo: string | null
```

---

4.8 Connection Layout (공통)

```
layout:
  strokeWidth: 'thin' | 'default' | 'thick'
  strokeColor: string
  textColor: string
  lineStyle?: string   # status 기반 자동 결정
```

	•	lineStyle은 entity.status 기반으로 자동 매핑
	•	pathPoints는 직선 기준 → 불필요

---

### 5. Annotation (자유 텍스트 박스)

```
- id: UUID
  text: string
  layout:
    center: { x: number, y: number }
    style:
      size: 'small' | 'default' | 'large'
      bgColor: string
      textColor: string
      borderStyle: string
      borderColor: string
```

	•	도형과 독립된 레이어
	•	설명/주석/메모용

---

### 6. View (캔버스 상태)

```
view:
  viewPoint:
    center: { x: number, y: number }
    zoom: number
  visibility:
    name: boolean
    age: boolean
    birthDate: boolean
    deathDate: boolean
    detail: boolean
    clinicStatus: boolean
    relationLine: boolean
    groupLine: boolean
    grid: boolean
    memo: boolean
```


---

### 7. 트리 & 인덱싱 활용 (Derived Structures)

7.1 Runtime 파생 구조 (저장하지 않음)
	•	subjectIndex: Map<id, Subject>
	•	connectionIndex: Map<id, Connection>
	•	childrenByParentRef
	•	partnersBySubjectId
	•	groupMemberships

7.2 용도
	•	자동 레이아웃
	•	다중 선택 이동
	•	커플 단위 자식 정렬
	•	복합 커맨드 (Delete Partner → 자식 재배치 등)

---

### 8. 결론
	•	본 설계는 Graph 중심 + UI 계산 분리 + 단일 데이터 소스를 유지
	•	트리는 “저장 구조”가 아니라 연산용 파생 구조
	•	복잡한 가계도 표현, 편집, 확장을 모두 수용 가능
