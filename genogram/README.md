# Genogram Library

가계도(Genogram) 에디터를 위한 TypeScript 라이브러리입니다.

## 목차

- [설치 및 임포트](#설치-및-임포트)
- [핵심 개념](#핵심-개념)
- [기본 사용법](#기본-사용법)
- [Person (사람) 관리](#person-사람-관리)
- [Relationship (관계) 관리](#relationship-관계-관리)
- [레이아웃 및 캔버스](#레이아웃-및-캔버스)
- [Undo/Redo](#undoredo)
- [직렬화 및 저장](#직렬화-및-저장)
- [이벤트 처리](#이벤트-처리)
- [마우스 인터랙션](#마우스-인터랙션)
- [API 레퍼런스](#api-레퍼런스)

---

## 설치 및 임포트

```typescript
import {
  // Editor
  GenogramEditor,

  // Enums
  Gender,
  ToolMode,
  RelationType,
  PartnerStatus,
  ChildStatus,
  EmotionalStatus,
  ArrowDirection,
  LineStyle,

  // Types
  Point,
  UUID,
} from "./genogram";
```

---

## 핵심 개념

### 데이터와 레이아웃의 분리

이 라이브러리는 **도메인 데이터**와 **캔버스 레이아웃**을 분리합니다:

| 구분                  | 설명                     | 예시                                |
| --------------------- | ------------------------ | ----------------------------------- |
| **Genogram** (데이터) | 사람, 관계, 가계도 정보  | Person, Relationship, FamilyTree    |
| **Layout** (레이아웃) | 캔버스 상의 위치, 스타일 | NodeLayout, EdgeLayout, CanvasState |

### Command Pattern

모든 상태 변경은 **Command** 객체를 통해 수행됩니다:

- 자동으로 Undo/Redo 히스토리 관리
- 변경 사항 추적 가능
- 저장되지 않은 변경 감지

---

## 기본 사용법

### 에디터 생성

```typescript
const editor = new GenogramEditor();

// 또는 설정과 함께 생성
const editor = new GenogramEditor({
  layout: {
    nodeWidth: 50,
    nodeHeight: 50,
    horizontalGap: 80,
    verticalGap: 100,
  },
  commandManager: {
    maxHistorySize: 100,
  },
  autoSaveInterval: 30000, // 30초마다 state-change 이벤트 발생
});
```

### 에디터 정리

```typescript
// 컴포넌트 언마운트 시 호출
editor.dispose();
```

---

## Person (사람) 관리

### 사람 추가

```typescript
// 사람 추가 (이름, 성별, 위치, 세대)
const personId = editor.addPerson("홍길동", Gender.Male, { x: 200, y: 100 }, 0);

// 여성 추가
const wifeId = editor.addPerson("김영희", Gender.Female, { x: 300, y: 100 }, 0);

// 자녀 추가 (세대 = 1)
const childId = editor.addPerson("홍철수", Gender.Male, { x: 250, y: 200 }, 1);
```

### 사람 정보 수정

```typescript
editor.updatePerson(personId, {
  name: "홍길동 (수정)",
  isDeceased: true,
  deathDate: "2020-01-15",
  causeOfDeath: "자연사",
  occupation: "교사",
  memo: "가장",
});
```

### 사람 삭제

```typescript
editor.deletePerson(personId);
// 연결된 모든 관계도 자동으로 삭제됩니다
```

### 사람 이동

```typescript
// 단일 이동
editor.movePerson(personId, { x: 300, y: 150 });

// 다중 이동 (선택된 여러 노드)
editor.moveMultiplePersons([
  { personId: id1, position: { x: 100, y: 100 } },
  { personId: id2, position: { x: 200, y: 100 } },
]);
```

---

## Relationship (관계) 관리

### 파트너 관계

```typescript
// 결혼 관계
const marriageId = editor.addPartnerRelationship(
  husbandId,
  wifeId,
  PartnerStatus.Married,
);

// 다른 파트너 상태
PartnerStatus.Married; // 결혼
PartnerStatus.Divorced; // 이혼
PartnerStatus.Separated; // 별거
PartnerStatus.Engaged; // 약혼
PartnerStatus.Cohabiting; // 동거
PartnerStatus.Widowed; // 사별
```

### 부모-자녀 관계

```typescript
// 생물학적 자녀
const childRelId = editor.addChildRelationship(
  parentId,
  childId,
  ChildStatus.Biological,
);

// 부모 관계(결혼)를 통한 자녀 연결
const childRelId = editor.addChildRelationship(
  parentId,
  childId,
  ChildStatus.Biological,
  marriageId, // 부모의 결혼 관계 ID
);

// 자녀 상태
ChildStatus.Biological; // 생물학적
ChildStatus.Adopted; // 입양
ChildStatus.Foster; // 위탁
ChildStatus.Stepchild; // 의붓자녀
ChildStatus.Miscarriage; // 유산
ChildStatus.Abortion; // 낙태
ChildStatus.Stillbirth; // 사산
```

### 감정적 관계

```typescript
const emotionalRelId = editor.addEmotionalRelationship(
  person1Id,
  person2Id,
  EmotionalStatus.Hostile,
);

// 감정 상태
EmotionalStatus.Basic; // 기본
EmotionalStatus.Close; // 친밀
EmotionalStatus.VeryClose; // 매우 친밀
EmotionalStatus.Hostile; // 적대적
EmotionalStatus.VeryHostile; // 매우 적대적
EmotionalStatus.Cutoff; // 단절
EmotionalStatus.Distant; // 거리감
EmotionalStatus.Fused; // 융합
EmotionalStatus.Conflict; // 갈등
```

### 관계 스타일 수정

```typescript
// 화살표 방향 설정
editor.setEdgeArrowDirection(relationshipId, ArrowDirection.Forward);

// ArrowDirection 옵션
ArrowDirection.None; // 없음
ArrowDirection.Forward; // 정방향
ArrowDirection.Backward; // 역방향
ArrowDirection.Both; // 양방향

// 라벨 추가
editor.setEdgeLabel(relationshipId, "2010년 결혼");

// 상세 스타일 수정
editor.updateEdgeStyle(relationshipId, {
  lineStyle: LineStyle.Dashed,
  strokeColor: "#FF0000",
  strokeWidth: 2,
});
```

### 관계 삭제

```typescript
editor.deleteRelationship(relationshipId);
```

---

## 레이아웃 및 캔버스

### 줌 (Zoom)

```typescript
// 줌 레벨 설정 (1.0 = 100%)
editor.setZoom(1.5);

// 현재 줌 레벨 조회
const zoom = editor.getZoom();
```

### 오프셋 (Pan)

```typescript
// 캔버스 위치 이동
editor.setOffset({ x: -100, y: -50 });

// 현재 오프셋 조회
const offset = editor.getOffset();
```

### 그리드 스냅

```typescript
// 그리드 스냅 토글
editor.toggleGridSnap();

// 그리드 스냅 활성화 여부
const isEnabled = editor.isGridSnapEnabled();
```

### 자동 레이아웃

```typescript
// 세대 기반 자동 배치
editor.autoLayout();
```

### 뷰 설정

```typescript
editor.updateViewSettings({
  showGrid: true,
  showMinimap: true,
  showRelationshipLabels: true,
  showNodeLabels: true,
  showAgeLabels: false,
});
```

---

## Undo/Redo

```typescript
// Undo
if (editor.canUndo()) {
  editor.undo();
}

// Redo
if (editor.canRedo()) {
  editor.redo();
}

// 저장되지 않은 변경 확인
if (editor.hasUnsavedChanges()) {
  // 저장 확인 다이얼로그 표시
}

// 저장 완료 표시
editor.markSaved();
```

---

## 직렬화 및 저장

### JSON으로 저장

```typescript
// JSON 문자열로 변환
const json = editor.toJSON();
localStorage.setItem("genogram", json);

// 또는 객체로 직렬화
const data = editor.serialize();
await saveToServer(data);
```

### JSON에서 불러오기

```typescript
// JSON 문자열에서 복원
const json = localStorage.getItem("genogram");
if (json) {
  editor.fromJSON(json);
}

// 또는 객체에서 복원
const data = await loadFromServer();
editor.deserialize(data);
```

---

## 이벤트 처리

```typescript
// 이벤트 리스너 등록
const unsubscribe = editor.on((eventType, data) => {
  switch (eventType) {
    case "state-change":
      console.log("상태 변경됨");
      renderCanvas();
      break;

    case "selection-change":
      console.log("선택 변경됨:", data);
      updatePropertyPanel(data);
      break;

    case "view-change":
      console.log("뷰 설정 변경됨:", data);
      break;

    case "tool-change":
      console.log("도구 변경됨:", data);
      updateToolbar(data);
      break;

    case "interaction-change":
      console.log("인터랙션 상태 변경됨");
      break;
  }
});

// 이벤트 리스너 해제
unsubscribe();
```

---

## 마우스 인터랙션

### 도구 모드 설정

```typescript
editor.setToolMode(ToolMode.Select);

// 도구 모드
ToolMode.Select; // 선택
ToolMode.MultiSelect; // 다중 선택
ToolMode.Pan; // 캔버스 이동
ToolMode.Connect; // 연결선 그리기
ToolMode.CreateNode; // 노드 생성
```

### 마우스 이벤트 연결

```typescript
canvas.addEventListener("mousedown", (e) => {
  const point = screenToCanvas(e.clientX, e.clientY);
  editor.handleMouseDown(point);
});

canvas.addEventListener("mousemove", (e) => {
  const point = screenToCanvas(e.clientX, e.clientY);
  editor.handleMouseMove(point);
});

canvas.addEventListener("mouseup", (e) => {
  const point = screenToCanvas(e.clientX, e.clientY);
  editor.handleMouseUp(point);
});

canvas.addEventListener("wheel", (e) => {
  editor.handleWheel(e.deltaY);
});
```

### 선택 관리

```typescript
// 특정 노드 선택
editor.select([nodeId1, nodeId2]);

// 모든 선택 해제
editor.deselectAll();

// 선택된 항목 조회
const selectedItems = editor.getSelectedItems();
// [{ id: 'xxx', type: AssetType.Node }, ...]

// 선택된 항목 삭제
editor.deleteSelected();
```

### 히트 테스트

```typescript
// 특정 좌표의 노드 찾기
const node = editor.getNodeAtPoint({ x: 150, y: 200 });

// 영역 내 노드들 찾기
const nodes = editor.getNodesInRect({
  x: 100,
  y: 100,
  width: 200,
  height: 200,
});
```

---

## API 레퍼런스

### GenogramEditor 메서드

| 메서드                                                          | 설명                |
| --------------------------------------------------------------- | ------------------- |
| `addPerson(name, gender, position, generation)`                 | 사람 추가           |
| `deletePerson(id)`                                              | 사람 삭제           |
| `updatePerson(id, updates)`                                     | 사람 정보 수정      |
| `movePerson(id, position)`                                      | 사람 위치 이동      |
| `moveMultiplePersons(moves)`                                    | 여러 사람 동시 이동 |
| `addPartnerRelationship(id1, id2, status)`                      | 파트너 관계 추가    |
| `addChildRelationship(parentId, childId, status, parentRelId?)` | 부모-자녀 관계 추가 |
| `addEmotionalRelationship(id1, id2, status)`                    | 감정적 관계 추가    |
| `deleteRelationship(id)`                                        | 관계 삭제           |
| `setEdgeArrowDirection(id, direction)`                          | 화살표 방향 설정    |
| `setEdgeLabel(id, label)`                                       | 관계 라벨 설정      |
| `updateEdgeStyle(id, updates)`                                  | 선 스타일 수정      |
| `select(ids, clearOthers?)`                                     | 노드 선택           |
| `deselectAll()`                                                 | 선택 해제           |
| `deleteSelected()`                                              | 선택된 항목 삭제    |
| `setZoom(level)`                                                | 줌 레벨 설정        |
| `setOffset(point)`                                              | 캔버스 오프셋 설정  |
| `toggleGridSnap()`                                              | 그리드 스냅 토글    |
| `autoLayout()`                                                  | 자동 레이아웃       |
| `undo()`                                                        | 실행 취소           |
| `redo()`                                                        | 다시 실행           |
| `serialize()`                                                   | 직렬화              |
| `deserialize(data)`                                             | 역직렬화            |
| `toJSON()`                                                      | JSON 문자열로 변환  |
| `fromJSON(json)`                                                | JSON에서 복원       |
| `on(listener)`                                                  | 이벤트 리스너 등록  |
| `dispose()`                                                     | 에디터 정리         |

### Enums

```typescript
// Gender (성별)
enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  Other = "OTHER",
  Unknown = "UNKNOWN",
}

// ToolMode (도구 모드)
enum ToolMode {
  Select = "SELECT",
  MultiSelect = "MULTI_SELECT",
  Pan = "PAN",
  Zoom = "ZOOM",
  Connect = "CONNECT",
  CreateNode = "CREATE_NODE",
  CreateText = "CREATE_TEXT",
}

// LineStyle (선 스타일)
enum LineStyle {
  Solid = "SOLID",
  Dashed = "DASHED",
  Dotted = "DOTTED",
  Double = "DOUBLE",
  Wavy = "WAVY",
}

// ArrowDirection (화살표 방향)
enum ArrowDirection {
  None = "NONE",
  Forward = "FORWARD",
  Backward = "BACKWARD",
  Both = "BOTH",
}
```

---

## 렌더링 예시 (Canvas 2D)

```typescript
function render(ctx: CanvasRenderingContext2D, editor: GenogramEditor) {
  const layout = editor.getLayout();
  const genogram = editor.getGenogram();
  const interaction = editor.getInteraction();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 줌 및 오프셋 적용
  ctx.save();
  ctx.translate(layout.canvas.offset.x, layout.canvas.offset.y);
  ctx.scale(layout.canvas.zoomLevel, layout.canvas.zoomLevel);

  // 그리드 그리기 (옵션)
  if (layout.canvas.gridSnap) {
    drawGrid(ctx, layout.canvas.gridSize);
  }

  // 엣지 그리기
  layout.edges.forEach((edge, id) => {
    if (!edge.isVisible) return;
    drawEdge(ctx, edge, edge.isSelected);
  });

  // 노드 그리기
  layout.nodes.forEach((node, id) => {
    if (!node.isVisible) return;
    const person = genogram.persons.get(id);
    if (person) {
      drawNode(ctx, node, person, node.isSelected);
    }
  });

  // 연결 미리보기 그리기
  if (interaction.connectionPreview.isActive) {
    drawConnectionPreview(ctx, interaction.connectionPreview);
  }

  // 선택 박스 그리기
  if (interaction.selectionBox.isActive) {
    drawSelectionBox(ctx, interaction.selectionBox);
  }

  ctx.restore();
}
```

---

## 라이선스

MIT License
