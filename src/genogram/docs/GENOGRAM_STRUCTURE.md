# Genogram 데이터 구조 명세

이 문서는 가계도(Genogram) 데이터의 구조를 설명합니다.

## 📊 전체 구조 개요

```
genogram
├── version               # 스키마 버전
├── metadata              # 메타데이터 (제목, 작성자, 날짜 등)
├── subjects[]            # 주체 (인물) 목록
├── connections[]         # 연결 (관계) 목록
└── schema                # 스키마 정의 (타입, 상태, 모양 등)
```

---

## 📋 Metadata

```yaml
metadata:
  title: "홍씨 가문 가계도"
  created_at: "2026-01-26"
  last_modified: "2026-01-26"
  author: "gngsn"
```

---

## 👤 Subjects (주체/인물)

각 인물은 `entity`(데이터)와 `layout`(렌더링 정보)으로 구성됩니다.

```
subject
├── id                    # 고유 식별자 (UUID)
├── entity
│   ├── type              # person
│   ├── name              # 이름
│   └── attributes
│       ├── gender        # male | female
│       ├── birth_year    # 출생년도
│       ├── death_year    # 사망년도 (null이면 생존)
│       ├── age           # 나이
│       ├── is_deceased   # 사망 여부
│       ├── occupation    # 직업
│       ├── personality[] # 성격 특성
│       └── notes         # 메모
│
└── layout
    ├── position          # { x, y }
    ├── size              # 크기 배율
    ├── shape             # square(남) | circle(여) | diamond(미상)
    ├── fill_color        # 채우기 색상
    ├── fill_opacity      # 채우기 투명도
    ├── border_color      # 테두리 색상
    ├── border_width      # 테두리 두께
    └── decoration        # cross(사망) | diagonal(유산) 등
```

---

## 🔗 Connections (연결/관계)

### 배우자 관계 (spouse)

```
connection (spouse)
├── id
├── entity
│   ├── type: spouse
│   ├── subjects[]        # 두 인물의 ID
│   ├── status            # married | divorced | widowed | separated
│   └── metadata
│       ├── married_at    # 결혼 연도
│       ├── divorced_at   # 이혼 연도
│       └── notes         # 메모
│
└── layout
    ├── line_type         # horizontal | zigzag | arrow
    ├── line_color        # 선 색상
    ├── line_width        # 선 두께
    ├── line_style        # solid | dashed | dotted
    ├── decoration        # cross(이혼 표시) 등
    └── arrow_direction   # bidirectional (양방향)
```

### 부모-자식 관계 (parent_child)

```
connection (parent_child)
├── id
├── entity
│   ├── type: parent_child
│   ├── parent_union      # 부모 배우자 관계 ID 참조
│   ├── child             # 자식 인물 ID
│   └── biological        # 친자 여부
│
└── layout
    ├── line_type: vertical
    ├── line_color
    ├── line_width
    ├── line_style
    └── connection_point  # { x, y } 연결 지점
```

---

## 📐 Schema 정의

| 카테고리 | 값 |
|---------|-----|
| **subject_types** | `person`, `family_unit` |
| **connection_types** | `spouse`, `parent_child`, `sibling`, `adoptive_parent`, `step_parent` |
| **spouse_statuses** | `married`, `divorced`, `widowed`, `separated`, `common_law` |
| **shapes** | `square`(남), `circle`(여), `diamond`(미상) |
| **decorations** | `cross`(사망), `diagonal`(유산/사산), `double`(쌍둥이) |
| **line_types** | `horizontal`, `vertical`, `zigzag`, `dashed`, `dotted`, `arrow` |

---

## 📄 전체 예시

```yaml
genogram:
  version: "1.0"
  metadata:
    title: "홍씨 가문 가계도"
    created_at: "2026-01-26"
    last_modified: "2026-01-26"
    author: "gngsn"

  # ==========================================
  # 주체 (인물)
  # ==========================================
  subjects:
    # 1세대
    - id: "a1b2c3d4-hong-gildong"
      entity:
        type: person
        name: "홍길동"
        attributes:
          gender: male
          birth_year: 1960
          death_year: null
          age: 66
          is_deceased: false
          occupation: "학교 선생님"
          personality:
            - "가부장적"
          notes: ""
      layout:
        position:
          x: -200
          y: 0
        size: 2
        shape: square
        fill_color: "#000000"
        fill_opacity: 0.5
        border_color: "#000000"
        border_width: 2

    - id: "e5f6g7h8-lee-younghee"
      entity:
        type: person
        name: "이영희"
        attributes:
          gender: female
          birth_year: 1967
          death_year: 2022
          age: 62
          is_deceased: true
          occupation: null
          notes: "향년 62세"
      layout:
        position:
          x: -50
          y: 0
        size: 2
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2
        decoration: cross  # 사망자 X 표시

    # 2세대
    - id: "i9j0k1l2-hong-booja"
      entity:
        type: person
        name: "홍부자"
        attributes:
          gender: male
          birth_year: 1987
          death_year: null
          age: 39
          is_deceased: false
      layout:
        position:
          x: -125
          y: 100
        size: 2
        shape: square
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    - id: "m3n4o5p6-former-spouse"
      entity:
        type: person
        name: "이전 배우자"
        attributes:
          gender: female
          is_deceased: false
      layout:
        position:
          x: -50
          y: 100
        size: 1.5
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    - id: "q7r8s9t0-current-spouse"
      entity:
        type: person
        name: "현재 배우자"
        attributes:
          gender: female
          is_deceased: false
      layout:
        position:
          x: 50
          y: 100
        size: 2
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    # 다른 가계
    - id: "u1v2w3x4-other-father"
      entity:
        type: person
        name: "타가계 아버지"
        attributes:
          gender: male
          is_deceased: true
      layout:
        position:
          x: 200
          y: 100
        size: 2
        shape: square
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2
        decoration: cross

    - id: "y5z6a7b8-other-mother"
      entity:
        type: person
        name: "타가계 어머니"
        attributes:
          gender: female
          is_deceased: false
      layout:
        position:
          x: 300
          y: 100
        size: 2
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    - id: "c9d0e1f2-other-daughter"
      entity:
        type: person
        name: "타가계 딸"
        attributes:
          gender: female
          is_deceased: false
      layout:
        position:
          x: 250
          y: 200
        size: 2
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    # 3세대
    - id: "g3h4i5j6-son-1"
      entity:
        type: person
        name: "장남"
        attributes:
          gender: male
          is_deceased: false
      layout:
        position:
          x: -50
          y: 200
        size: 2
        shape: square
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    - id: "k7l8m9n0-son-2"
      entity:
        type: person
        name: "차남"
        attributes:
          gender: male
          is_deceased: false
      layout:
        position:
          x: 50
          y: 200
        size: 2
        shape: square
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

    - id: "o1p2q3r4-daughter-1"
      entity:
        type: person
        name: "딸"
        attributes:
          gender: female
          is_deceased: false
      layout:
        position:
          x: 150
          y: 200
        size: 2
        shape: circle
        fill_color: "#FFFFFF"
        fill_opacity: 1.0
        border_color: "#000000"
        border_width: 2

  # ==========================================
  # 연결 (관계)
  # ==========================================
  connections:
    # 배우자 관계
    - id: "rel-spouse-001"
      entity:
        type: spouse
        subjects:
          - "a1b2c3d4-hong-gildong"
          - "e5f6g7h8-lee-younghee"
        status: divorced
        metadata:
          married_at: null
          divorced_at: null
          notes: "이혼"
      layout:
        line_type: zigzag
        line_color: "#FF0000"
        line_width: 2
        line_style: solid

    - id: "rel-spouse-002"
      entity:
        type: spouse
        subjects:
          - "i9j0k1l2-hong-booja"
          - "m3n4o5p6-former-spouse"
        status: divorced
        metadata:
          married_at: null
          divorced_at: null
          notes: "이혼"
      layout:
        line_type: horizontal
        line_color: "#FF0000"
        line_width: 2
        line_style: solid
        decoration: cross  # X 표시

    - id: "rel-spouse-003"
      entity:
        type: spouse
        subjects:
          - "i9j0k1l2-hong-booja"
          - "q7r8s9t0-current-spouse"
        status: married
        metadata:
          married_at: 2005
          divorced_at: null
          notes: "m. 2005"
      layout:
        line_type: horizontal
        line_color: "#000000"
        line_width: 2
        line_style: solid

    - id: "rel-spouse-004"
      entity:
        type: spouse
        subjects:
          - "u1v2w3x4-other-father"
          - "y5z6a7b8-other-mother"
        status: widowed
        metadata:
          married_at: null
          notes: "사별 (남편 사망)"
      layout:
        line_type: horizontal
        line_color: "#000000"
        line_width: 2
        line_style: solid

    - id: "rel-spouse-005"
      entity:
        type: spouse
        subjects:
          - "g3h4i5j6-son-1"
          - "c9d0e1f2-other-daughter"
        status: married
        metadata:
          married_at: null
          notes: "혼인"
      layout:
        line_type: arrow
        line_color: "#0000FF"
        line_width: 2
        line_style: solid
        arrow_direction: bidirectional

    # 부모-자식 관계
    # 홍길동 + 이영희 → 홍부자
    - id: "rel-parent-001"
      entity:
        type: parent_child
        parent_union: "rel-spouse-001"  # 부모 관계 참조
        child: "i9j0k1l2-hong-booja"
        biological: true
      layout:
        line_type: vertical
        line_color: "#000000"
        line_width: 2
        line_style: solid
        connection_point:
          x: -125
          y: 50

    # 홍부자 + 현재 배우자 → 자녀들
    - id: "rel-parent-002"
      entity:
        type: parent_child
        parent_union: "rel-spouse-003"
        child: "g3h4i5j6-son-1"
        biological: true
      layout:
        line_type: vertical
        line_color: "#000000"
        line_width: 2
        line_style: solid
        connection_point:
          x: 0
          y: 150

    - id: "rel-parent-003"
      entity:
        type: parent_child
        parent_union: "rel-spouse-003"
        child: "k7l8m9n0-son-2"
        biological: true
      layout:
        line_type: vertical
        line_color: "#000000"
        line_width: 2
        line_style: solid
        connection_point:
          x: 0
          y: 150

    - id: "rel-parent-004"
      entity:
        type: parent_child
        parent_union: "rel-spouse-003"
        child: "o1p2q3r4-daughter-1"
        biological: true
      layout:
        line_type: vertical
        line_color: "#000000"
        line_width: 2
        line_style: solid
        connection_point:
          x: 0
          y: 150

    # 타가계 부모 → 딸
    - id: "rel-parent-005"
      entity:
        type: parent_child
        parent_union: "rel-spouse-004"
        child: "c9d0e1f2-other-daughter"
        biological: true
      layout:
        line_type: vertical
        line_color: "#000000"
        line_width: 2
        line_style: solid
        connection_point:
          x: 250
          y: 150

  # ==========================================
  # 스키마 정의
  # ==========================================
  schema:
    subject_types:
      - person
      - family_unit  # 향후 확장 가능

    connection_types:
      - spouse
      - parent_child
      - sibling
      - adoptive_parent
      - step_parent

    spouse_statuses:
      - married
      - divorced
      - widowed
      - separated
      - common_law  # 사실혼

    shapes:
      - square      # 남성
      - circle      # 여성
      - diamond     # 성별 미상

    decorations:
      - cross       # 사망자
      - diagonal    # 유산/사산
      - double      # 쌍둥이

    line_types:
      - horizontal  # 배우자 연결
      - vertical    # 부모-자식 연결
      - zigzag      # 이혼
      - dashed      # 별거
      - dotted      # 비공식 관계
      - arrow       # 방향성 관계
```
