import { useCallback, useState } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GenogramEditor } from '@/genogram/core/editor/genogram-editor';
import type { SelectedItem } from '@/genogram/core/editor/interaction-state';
import type { Visibility } from '@/genogram/core/models/genogram';
import type {
  FetusAttribute,
  PersonAttribute,
  Subject,
} from '@/genogram/core/models/person';
import { getNodeShape } from '@/genogram/core/models/person';
import type {
  Connection,
  GroupAttribute,
  PartnerAttribute,
} from '@/genogram/core/models/relationship';
import type { Annotation } from '@/genogram/core/models/text-annotation';
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
import {
  resolveConnectionEndpoints,
  resolveConnectionHandles,
} from '@/genogram/core/utils/connection-resolver';
import {
  buildPartnerMidpoint,
  buildTwinTargetPosition,
  getSubjectSizePx,
} from '@/genogram/core/utils/edge-data-builder';
import {
  buildDetailTexts,
  buildLifeSpanLabel,
  resolveVisibleName,
} from '@/genogram/core/utils/node-data-builder';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
import type { AnnotationNodeData } from '../components/nodes/AnnotationNode';
import type { GroupBoundaryNodeData } from '../components/nodes/GroupBoundaryNode';
import { NODE_SIZE_PX } from '../constants/grid';

const GROUP_BOUNDARY_PADDING = 30;

/**
 * GenogramEditor 상태를 ReactFlow 노드/엣지로 변환하는 훅.
 * - syncFromEditor(): Editor → React Flow 전체 동기화
 * - syncSelectedSubject(): 선택된 Subject 상태 동기화
 */
export const useFlowSync = (
  getEditor: () => GenogramEditor | null,
  visibility: Visibility
) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);

  // Group boundary 노드 클릭 시 editor에 선택을 전달하는 콜백
  const handleGroupSelect = useCallback(
    (connectionId: string, additive: boolean) => {
      const editor = getEditor();
      if (!editor) return;
      editor.select([connectionId], !additive);
    },
    [getEditor]
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

      const lifeSpanLabel = buildLifeSpanLabel(personAttr, visibility);
      const detailTexts = buildDetailTexts(personAttr);
      const sizePx = getSubjectSizePx(subject, NODE_SIZE_PX);
      const visibleName = resolveVisibleName(subject, visibility);

      newNodes.push({
        id,
        type: 'person',
        position: nodeLayout.position,
        data: {
          name: visibleName,
          gender: personAttr?.gender,
          subjectType: subject.entity.type,
          age: visibility.age ? personAttr?.age : null,
          isIP: personAttr?.isIP ?? false,
          isDead: 'isDead' in attr ? attr.isDead : false,
          illness: visibility.illness ? personAttr?.illness : undefined,
          isSelected: nodeLayout.isSelected,
          lifeSpanLabel,
          detailTexts: visibility.extraInfo ? detailTexts : [],
          shortNote:
            visibility.extraInfo && personAttr?.extraInfo?.enable
              ? personAttr?.extraInfo?.shortNote
              : null,
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
      if (!visibility.groupLine) return;
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
          memo: visibility.memo ? conn.entity.memo : null,
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

    // Annotation → annotation 노드 변환 (부가설명 표시 토글)
    if (visibility.memo)
      genogram.annotations.forEach((annotation, id) => {
        const textLayout = layout.texts.get(id);
        if (!textLayout) return;

        const style = annotation.layout.style;

        newNodes.push({
          id: `annotation-${id}`,
          type: 'annotation',
          position: annotation.layout.center,
          data: {
            annotationId: id,
            text: annotation.text,
            bgColor: style.bgColor,
            textColor: style.textColor,
            borderStyle: style.borderStyle,
            borderColor: style.borderColor,
            isSelected: textLayout.isSelected,
          } satisfies AnnotationNodeData,
          zIndex: textLayout.zIndex,
          selected: textLayout.isSelected,
        });
      });

    // 엣지 변환
    const newEdges: Edge<RelationshipEdgeData>[] = [];
    genogram.connections.forEach((conn, id) => {
      // Group_Line은 오버레이 노드로 처리됨
      if (conn.entity.type === ConnectionType.Group_Line) return;

      // 관계선 visibility: Relation_Line, Influence_Line 숨김
      if (
        !visibility.relationLine &&
        (conn.entity.type === ConnectionType.Relation_Line ||
          conn.entity.type === ConnectionType.Influence_Line)
      ) {
        return;
      }

      const edgeLayout = layout.edges.get(id);
      if (!edgeLayout) return;

      const attr = conn.entity.attribute;
      const { source, target } = resolveConnectionEndpoints(conn, genogram);
      const { sourceHandle, targetHandle } = resolveConnectionHandles(
        conn.entity.type
      );
      const { partnerMidpoint, partnerSubjects } = buildPartnerMidpoint(
        conn,
        genogram,
        layout,
        NODE_SIZE_PX
      );
      const twinTargetPosition = buildTwinTargetPosition(
        conn,
        genogram,
        layout,
        NODE_SIZE_PX
      );

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
          sourceSizePx: getSubjectSizePx(
            genogram.subjects.get(source),
            NODE_SIZE_PX
          ),
          targetSizePx: getSubjectSizePx(
            genogram.subjects.get(target),
            NODE_SIZE_PX
          ),
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
  }, [getEditor, handleGroupSelect, visibility]);

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

  const syncSelectedAnnotation = useCallback(() => {
    const editor = getEditor();
    if (!editor) {
      setSelectedAnnotation(null);
      return;
    }

    const items = editor.getSelectedItems();

    if (items.length > 1) {
      setSelectedAnnotation(null);
      return;
    }

    const selectedText = items.find((item) => item.type === AssetType.Text);

    if (selectedText) {
      const ann = editor.getGenogram().annotations.get(selectedText.id);
      setSelectedAnnotation(ann ? { ...ann } : null);
    } else {
      setSelectedAnnotation(null);
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
    selectedAnnotation,
    selectedItems,
    syncFromEditor,
    syncSelectedSubject,
    syncSelectedConnection,
    syncSelectedAnnotation,
    syncSelectedItems,
  };
};
