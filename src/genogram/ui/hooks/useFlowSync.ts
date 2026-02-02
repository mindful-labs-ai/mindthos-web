import { useCallback, useState } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GenogramEditor } from '@/genogram/core/editor/genogram-editor';
import type { SelectedItem } from '@/genogram/core/editor/interaction-state';
import type {
  Subject,
  PersonAttribute,
  FetusAttribute,
} from '@/genogram/core/models/person';
import { getNodeShape } from '@/genogram/core/models/person';
import type {
  Connection,
  GroupAttribute,
  ParentChildAttribute,
  PartnerAttribute,
} from '@/genogram/core/models/relationship';
import {
  AssetType,
  ConnectionType,
  SubjectType,
} from '@/genogram/core/types/enums';
import type {
  InfluenceStatus,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
import type { GroupBoundaryNodeData } from '../components/nodes/GroupBoundaryNode';
import { NODE_SIZE_PX } from '../constants/grid';

const GROUP_BOUNDARY_PADDING = 30;

/** Subject의 size 속성에서 px 크기를 안전하게 조회 */
const getSubjectSizePx = (subject: Subject | undefined): number =>
  NODE_SIZE_PX[subject?.layout.style.size ?? ''] ?? NODE_SIZE_PX.DEFAULT;

/**
 * GenogramEditor 상태를 ReactFlow 노드/엣지로 변환하는 훅.
 * - syncFromEditor(): Editor → React Flow 전체 동기화
 * - syncSelectedSubject(): 선택된 Subject 상태 동기화
 */
export const useFlowSync = (getEditor: () => GenogramEditor | null) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Group boundary 노드 클릭 시 editor에 선택을 전달하는 콜백
  const handleGroupSelect = useCallback(
    (connectionId: string, additive: boolean) => {
      const editor = getEditor();
      if (!editor) return;
      editor.select([connectionId], !additive);
    },
    [getEditor],
  );

  const syncFromEditor = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;

    const genogram = editor.getGenogram();
    const layout = editor.getLayout();

    // 노드 변환
    const newNodes: Node[] = [];
    genogram.subjects.forEach((subject, id) => {
      const nodeLayout = layout.nodes.get(id);
      if (!nodeLayout) return;

      const isPerson = subject.entity.type === SubjectType.Person;
      const isFetus = subject.entity.type === SubjectType.Fetus;
      const attr = subject.entity.attribute;
      const personAttr = isPerson ? (attr as PersonAttribute) : null;
      const fetusAttr = isFetus ? (attr as FetusAttribute) : null;

      // 생몰연도 포맷: "1980-" 또는 "1980 ~ 2024"
      let lifeSpanLabel: string | null = null;
      if (personAttr?.lifeSpan.birth) {
        const birthPart = personAttr.lifeSpan.birth.slice(0, 4);
        const deathPart = personAttr.lifeSpan.death
          ? personAttr.lifeSpan.death.slice(0, 4)
          : null;
        lifeSpanLabel = deathPart
          ? `${birthPart} ~ ${deathPart}`
          : `${birthPart}-`;
      }

      // 상세정보 텍스트 배열
      const detailTexts: string[] = [];
      if (personAttr?.detail.enable) {
        if (personAttr.detail.job) detailTexts.push(personAttr.detail.job);
        if (personAttr.detail.education)
          detailTexts.push(personAttr.detail.education);
        if (personAttr.detail.region)
          detailTexts.push(personAttr.detail.region);
      }

      const sizePx = getSubjectSizePx(subject);

      newNodes.push({
        id,
        type: 'person',
        position: nodeLayout.position,
        data: {
          name: isPerson
            ? (personAttr?.name ?? null)
            : (attr as { name: string | null }).name,
          gender: personAttr?.gender,
          subjectType: subject.entity.type,
          age: personAttr?.age,
          isDead: 'isDead' in attr ? attr.isDead : false,
          illness: personAttr?.illness,
          isSelected: nodeLayout.isSelected,
          lifeSpanLabel,
          detailTexts,
          sizePx,
          fetusStatus: fetusAttr?.status,
          bgColor: subject.layout.style.bgColor,
          textColor: subject.layout.style.textColor,
        },
        selected: nodeLayout.isSelected,
      });
    });

    // Group_Line → group-boundary 오버레이 노드 변환 (고정 좌표 기반)
    genogram.connections.forEach((conn, id) => {
      if (conn.entity.type !== ConnectionType.Group_Line) return;
      const edgeLayout = layout.edges.get(id);
      if (!edgeLayout) return;

      const groupAttr = conn.entity.attribute as GroupAttribute;
      const { memberPositions } = groupAttr;

      if (memberPositions.length < 2) return;

      // 바운딩 박스 계산 (nodeOrigin=[0.5, 0.5] 기준)
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const mp of memberPositions) {
        const half = mp.sizePx / 2;
        minX = Math.min(minX, mp.x - half);
        minY = Math.min(minY, mp.y - half);
        maxX = Math.max(maxX, mp.x + half);
        maxY = Math.max(maxY, mp.y + half);
      }

      const pad = GROUP_BOUNDARY_PADDING;
      const w = maxX - minX + pad * 2;
      const h = maxY - minY + pad * 2;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      newNodes.push({
        id: `group-boundary-${id}`,
        type: 'group-boundary',
        position: { x: cx, y: cy },
        data: {
          connectionId: id,
          memberPositions,
          strokeColor: conn.layout.strokeColor,
          memo: conn.entity.memo,
          isSelected: edgeLayout.isSelected,
          width: w,
          height: h,
          onSelect: handleGroupSelect,
        } satisfies GroupBoundaryNodeData,
        style: { pointerEvents: 'none' },
        zIndex: -1,
        draggable: false,
        selectable: false,
        focusable: false,
        selected: edgeLayout.isSelected,
      });
    });

    // 엣지 변환
    const newEdges: Edge<RelationshipEdgeData>[] = [];
    genogram.connections.forEach((conn, id) => {
      // Group_Line은 오버레이 노드로 처리됨
      if (conn.entity.type === ConnectionType.Group_Line) return;

      const edgeLayout = layout.edges.get(id);
      if (!edgeLayout) return;

      const attr = conn.entity.attribute;

      let source = '';
      let target = '';
      if ('subjects' in attr && Array.isArray(attr.subjects)) {
        source = attr.subjects[0];
        target = attr.subjects[1];
      } else if ('startRef' in attr && 'endRef' in attr) {
        source = attr.startRef;
        target = attr.endRef;
      } else if ('parentRef' in attr && 'childRef' in attr) {
        const pcAttr = attr as ParentChildAttribute;
        // parentRef가 파트너선 ID인지 Subject ID인지 판별
        const partnerConn = genogram.connections.get(pcAttr.parentRef);
        if (partnerConn && 'subjects' in partnerConn.entity.attribute) {
          // 파트너선 참조 → source는 파트너선의 첫 번째 Subject
          const pAttr = partnerConn.entity.attribute as PartnerAttribute;
          source = pAttr.subjects[0];
        } else {
          // Subject ID 직접 참조
          source = pcAttr.parentRef;
        }
        target = Array.isArray(pcAttr.childRef)
          ? pcAttr.childRef[0]
          : pcAttr.childRef;
      }

      // ConnectionType별 Handle 앵커 지정
      let sourceHandle: string | undefined;
      let targetHandle: string | undefined;

      switch (conn.entity.type) {
        case ConnectionType.Partner_Line:
          // 양쪽 노드 하단
          sourceHandle = 'bottom-source';
          targetHandle = 'bottom-target';
          break;
        case ConnectionType.Children_Parents_Line:
          // 부모=하단, 자녀=상단
          sourceHandle = 'bottom-source';
          targetHandle = 'top-target';
          break;
        case ConnectionType.Relation_Line:
        case ConnectionType.Influence_Line:
        default:
          // 노드 중심 간 직선
          sourceHandle = 'center-source';
          targetHandle = 'center-target';
          break;
      }

      // Children_Parents_Line: parentRef가 파트너선이면 중간 지점 및 부모 x 좌표 계산
      let partnerMidpoint: { x: number; y: number } | null = null;
      let partnerSubjects: { x1: number; x2: number } | null = null;
      if (
        conn.entity.type === ConnectionType.Children_Parents_Line &&
        'parentRef' in attr
      ) {
        const pcAttr = attr as ParentChildAttribute;
        const partnerConn = genogram.connections.get(pcAttr.parentRef);
        if (partnerConn && 'subjects' in partnerConn.entity.attribute) {
          const pAttr = partnerConn.entity.attribute as PartnerAttribute;
          const pos1 = layout.nodes.get(pAttr.subjects[0])?.position;
          const pos2 = layout.nodes.get(pAttr.subjects[1])?.position;
          if (pos1 && pos2) {
            const sizePx1 = getSubjectSizePx(
              genogram.subjects.get(pAttr.subjects[0])
            );
            const sizePx2 = getSubjectSizePx(
              genogram.subjects.get(pAttr.subjects[1])
            );
            const bottomY1 = pos1.y + sizePx1 / 2;
            const bottomY2 = pos2.y + sizePx2 / 2;
            const midX = (pos1.x + pos2.x) / 2;
            const bottomY = Math.max(bottomY1, bottomY2) + 40; // U자 offset
            partnerMidpoint = { x: midX, y: bottomY };
            partnerSubjects = { x1: pos1.x, x2: pos2.x };
          }
        }
      }

      // 쌍둥이: 두 번째 자녀 위치
      let twinTargetPosition: { x: number; y: number } | null = null;
      if (
        conn.entity.type === ConnectionType.Children_Parents_Line &&
        'childRef' in attr
      ) {
        const pcAttr = attr as ParentChildAttribute;
        if (Array.isArray(pcAttr.childRef) && pcAttr.childRef.length === 2) {
          const twin2Layout = layout.nodes.get(pcAttr.childRef[1]);
          if (twin2Layout) {
            const twin2SizePx = getSubjectSizePx(
              genogram.subjects.get(pcAttr.childRef[1])
            );
            // center → top handle 보정 (nodeOrigin=[0.5,0.5])
            twinTargetPosition = {
              x: twin2Layout.position.x,
              y: twin2Layout.position.y - twin2SizePx / 2,
            };
          }
        }
      }

      newEdges.push({
        id,
        type: 'relationship',
        source,
        target,
        sourceHandle,
        targetHandle,
        data: {
          connectionType: conn.entity.type,
          partnerStatus:
            conn.entity.type === ConnectionType.Partner_Line && 'status' in attr
              ? (attr.status as PartnerStatus)
              : undefined,
          partnerDetail:
            conn.entity.type === ConnectionType.Partner_Line && 'detail' in attr
              ? (attr as PartnerAttribute).detail
              : undefined,
          relationStatus:
            conn.entity.type === ConnectionType.Relation_Line &&
            'status' in attr
              ? (attr.status as RelationStatus)
              : undefined,
          influenceStatus:
            conn.entity.type === ConnectionType.Influence_Line &&
            'status' in attr
              ? (attr.status as InfluenceStatus)
              : undefined,
          parentChildStatus:
            conn.entity.type === ConnectionType.Children_Parents_Line &&
            'status' in attr
              ? (attr.status as ParentChildStatus)
              : undefined,
          sourceSizePx: getSubjectSizePx(genogram.subjects.get(source)),
          targetSizePx: getSubjectSizePx(genogram.subjects.get(target)),
          sourceShape: getNodeShape(genogram.subjects.get(source)),
          targetShape: getNodeShape(genogram.subjects.get(target)),
          partnerMidpoint,
          partnerSubjects,
          twinTargetPosition,
          strokeColor: conn.layout.strokeColor,
          strokeWidth: conn.layout.strokeWidth,
          textColor: conn.layout.textColor,
        },
        selected: edgeLayout.isSelected,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [getEditor, handleGroupSelect]);

  const syncSelectedSubject = useCallback(() => {
    const editor = getEditor();
    if (!editor) {
      setSelectedSubject(null);
      return;
    }

    const selectedItems = editor.getSelectedItems();

    // 다중 선택 시 속성 패널 숨김
    if (selectedItems.length > 1) {
      setSelectedSubject(null);
      return;
    }

    const selectedNode = selectedItems.find(
      (item) => item.type === AssetType.Node
    );

    if (selectedNode) {
      const subject = editor.getGenogram().subjects.get(selectedNode.id);
      setSelectedSubject(subject ? { ...subject } : null);
    } else {
      setSelectedSubject(null);
    }
  }, [getEditor]);

  const syncSelectedConnection = useCallback(() => {
    const editor = getEditor();
    if (!editor) {
      setSelectedConnection(null);
      return;
    }

    const items = editor.getSelectedItems();

    // 다중 선택 시 속성 패널 숨김
    if (items.length > 1) {
      setSelectedConnection(null);
      return;
    }

    const selectedEdge = items.find((item) => item.type === AssetType.Edge);

    if (selectedEdge) {
      const conn = editor.getGenogram().connections.get(selectedEdge.id);
      setSelectedConnection(conn ? { ...conn } : null);
    } else {
      setSelectedConnection(null);
    }
  }, [getEditor]);

  const syncSelectedItems = useCallback(() => {
    const editor = getEditor();
    if (!editor) {
      setSelectedItems([]);
      return;
    }
    setSelectedItems(editor.getSelectedItems());
  }, [getEditor]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedSubject,
    selectedConnection,
    selectedItems,
    syncFromEditor,
    syncSelectedSubject,
    syncSelectedConnection,
    syncSelectedItems,
  };
};
