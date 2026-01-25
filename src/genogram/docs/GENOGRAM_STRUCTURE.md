# Genogram JSON 구조 명세

이 문서는 가계도(Genogram) 데이터의 JSON 구조를 설명합니다.

## 📊 전체 구조 개요

```
genogram
├── familyTree[]          # 가족 트리 (루트 노드 배열)
├── annotation{}          # 주석/텍스트 박스
└── layout{}              # 전체 뷰 설정
```

---

## 🌳 Family Tree 노드 구조

```
familyTree[0] (root)
│
├── id: "{randomUUID}"
├── name: "root"
├── entity: {}
│
├── children[]  ─────────────────────────────────────┐
│   └── [0] Male Parent                              │
│       ├── id: "{randomUUID_A}"                     │
│       ├── entity                                   │
│       │   └── attribute                            │
│       │       ├── gender: "male"                   │
│       │       ├── age: 50                          │
│       │       └── deathDate: null                  │
│       │                                            │
│       └── children[]                               │
│           └── [0] grandchild1                      │
│               └── connections[]                    │
│                   └── type: "relationC"            │
│                                                    │
├── connections[]  ──────────────────────────────────┤
│   └── [0]                                          │
│       ├── entity                                   │
│       │   ├── type: "relationA"                    │
│       │   ├── targetId: "{randomUUID_B}"           │
│       │   └── attribute: {}                        │
│       └── layout                                   │
│           ├── style: "dashed"                      │
│           └── color: "#FF0000"                     │
│                                                    │
└── layout  ─────────────────────────────────────────┘
    ├── position: { x: 100, y: 100 }
    ├── scale: 1.0
    └── visibility: true
```

---

## 📝 Annotation 구조

```
annotation
└── text1
    ├── entity
    │   └── attribute: {}
    └── layout: {}
```

가계도 위에 덧붙이는 텍스트 박스 목록입니다.

---

## 🎛️ Layout (전역 뷰 설정)

```
layout
├── viewpoint
│   ├── center: { x: 50, y: 50 }
│   └── zoom: "100%"
│
└── visibility (표시 옵션)
    ├── name: true
    ├── age: true
    └── deathDate: false
```

---

## 🔑 핵심 패턴 요약

| 구성요소         | 설명                                      |
| ---------------- | ----------------------------------------- |
| **id**           | 노드 고유 식별자 (UUID)                   |
| **name**         | 표시 이름                                 |
| **entity**       | 실제 데이터 (attribute 포함)              |
| **children[]**   | 자식 노드 배열 (재귀 구조)                |
| **connections[]**| 다른 노드와의 관계 (targetId로 연결)      |
| **layout**       | 위치/스타일 정보 (렌더링용)               |

---

## 📄 예시 JSON

```json
{
  "genogram": {
    "familyTree": [
      {
        "id": "{randomUUID}",
        "name": "root",
        "entity": {},
        "children": [
          {
            "id": "{randomUUID_A}",
            "name": "Male Parent",
            "entity": {
              "attribute": {
                "gender": "male",
                "age": 50,
                "deathDate": null
              }
            },
            "children": [
              {
                "name": "grandchild1",
                "connections": [
                  {
                    "type": "relationC"
                  }
                ]
              }
            ]
          }
        ],
        "connections": [
          {
            "entity": {
              "type": "relationA",
              "targetId": "{randomUUID_B}",
              "attribute": {}
            },
            "layout": {
              "style": "dashed",
              "color": "#FF0000"
            }
          }
        ],
        "layout": {
          "position": {
            "x": 100.0,
            "y": 100.0
          },
          "scale": 1.0,
          "visibility": true
        }
      }
    ],
    "annotation": {
      "text1": {
        "entity": {
          "attribute": {}
        },
        "layout": {}
      }
    },
    "layout": {
      "viewpoint": {
        "center": {
          "x": 50.0,
          "y": 50.0
        },
        "zoom": "100%"
      },
      "visibility": {
        "name": true,
        "age": true,
        "deathDate": false
      }
    }
  }
}
```
