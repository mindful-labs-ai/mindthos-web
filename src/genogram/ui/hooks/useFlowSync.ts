import { useCallback, useState } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GenogramEditor } from '@/genogram/core/editor/genogram-editor';
import type { Subject, PersonAttribute } from '@/genogram/core/models/person';
import {
  AssetType,
  ConnectionType,
  PartnerStatus,
  SubjectType,
} from '@/genogram/core/types/enums';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
import type { PersonNodeData } from '../components/nodes/PersonNode';
import { NODE_SIZE_PX } from '../constants/grid';

/**
 * GenogramEditor 상태를 ReactFlow 노드/엣지로 변환하는 훅.
 * - syncFromEditor(): Editor → React Flow 전체 동기화
 * - syncSelectedSubject(): 선택된 Subject 상태 동기화
 */
export const useFlowSync = (
  getEditor: () => GenogramEditor | null
) => {
  const [nodes, setNodes] = useState<Node<PersonNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const syncFromEditor = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;

    const genogram = editor.getGenogram();
    const layout = editor.getLayout();

    // 노드 변환
    const newNodes: Node<PersonNodeData>[] = [];
    genogram.subjects.forEach((subject, id) => {
      const nodeLayout = layout.nodes.get(id);
      if (!nodeLayout) return;

      const isPerson = subject.entity.type === SubjectType.Person;
      const attr = subject.entity.attribute;
      const personAttr = isPerson ? (attr as PersonAttribute) : null;

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

      const sizePx =
        NODE_SIZE_PX[subject.layout.style.size] ?? NODE_SIZE_PX.DEFAULT;

      newNodes.push({
        id,
        type: 'person',
        position: nodeLayout.position,
        data: {
          name: isPerson
            ? personAttr!.name
            : (attr as { name: string | null }).name,
          gender: personAttr?.gender,
          subjectType: subject.entity.type,
          age: personAttr?.age,
          isDead: 'isDead' in attr ? attr.isDead : false,
          isSelected: nodeLayout.isSelected,
          lifeSpanLabel,
          detailTexts,
          sizePx,
        },
        selected: nodeLayout.isSelected,
      });
    });

    // 엣지 변환
    const newEdges: Edge<RelationshipEdgeData>[] = [];
    genogram.connections.forEach((conn, id) => {
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
        source = attr.parentRef;
        target = Array.isArray(attr.childRef)
          ? attr.childRef[0]
          : attr.childRef;
      }

      newEdges.push({
        id,
        type: 'relationship',
        source,
        target,
        data: {
          connectionType: conn.entity.type,
          partnerStatus:
            conn.entity.type === ConnectionType.Partner && 'status' in attr
              ? (attr.status as (typeof PartnerStatus)[keyof typeof PartnerStatus])
              : undefined,
        },
        selected: edgeLayout.isSelected,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [getEditor]);

  const syncSelectedSubject = useCallback(() => {
    const editor = getEditor();
    if (!editor) {
      setSelectedSubject(null);
      return;
    }

    const selectedItems = editor.getSelectedItems();
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

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedSubject,
    syncFromEditor,
    syncSelectedSubject,
  };
};
