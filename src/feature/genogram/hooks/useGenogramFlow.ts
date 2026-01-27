import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection as FlowConnection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';

import { GenogramEditor } from '@/genogram/core/editor/genogram-editor';
import type { PersonAttribute } from '@/genogram/core/models/person';
import {
  ConnectionType,
  Gender,
  PartnerStatus,
  SubjectType,
} from '@/genogram/core/types/enums';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
import type { PersonNodeData } from '../components/nodes/PersonNode';

export interface UseGenogramFlowOptions {
  initialData?: string; // JSON 데이터
}

export const useGenogramFlow = (options: UseGenogramFlowOptions = {}) => {
  const editorRef = useRef<GenogramEditor | null>(null);
  const [nodes, setNodes] = useState<Node<PersonNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>([]);

  // GenogramEditor 초기화
  useEffect(() => {
    const editor = new GenogramEditor({
      layout: {
        nodeWidth: 50,
        nodeHeight: 50,
        horizontalGap: 100,
        verticalGap: 120,
      },
      commandManager: {
        maxHistorySize: 50,
      },
    });

    // 초기 데이터 로드
    if (options.initialData) {
      try {
        editor.fromJSON(options.initialData);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    }

    editorRef.current = editor;

    // 상태 변경 이벤트 구독
    const unsubscribe = editor.on((eventType) => {
      if (eventType === 'state-change') {
        syncFromEditor();
      }
    });

    // 초기 동기화
    syncFromEditor();

    return () => {
      unsubscribe();
      editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editor 상태를 React Flow로 동기화
  const syncFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const genogram = editor.getGenogram();
    const layout = editor.getLayout();

    // 노드 변환
    const newNodes: Node<PersonNodeData>[] = [];
    genogram.subjects.forEach((subject, id) => {
      const nodeLayout = layout.nodes.get(id);
      if (nodeLayout) {
        const isPerson = subject.entity.type === SubjectType.Person;
        const attr = subject.entity.attribute;
        const personAttr = isPerson ? (attr as PersonAttribute) : null;

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
          },
          selected: nodeLayout.isSelected,
        });
      }
    });

    // 엣지 변환
    const newEdges: Edge<RelationshipEdgeData>[] = [];
    genogram.connections.forEach((conn, id) => {
      const edgeLayout = layout.edges.get(id);
      if (edgeLayout) {
        const attr = conn.entity.attribute;

        // Determine source/target from attribute
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
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  // 노드 변경 핸들러
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<PersonNodeData>>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // 위치 변경을 Editor에 반영
      const editor = editorRef.current;
      if (!editor) return;

      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.id) {
          editor.moveSubject(change.id, change.position);
        }
      });
    },
    []
  );

  // 엣지 변경 핸들러
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<RelationshipEdgeData>>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  // 연결 핸들러
  const onConnect = useCallback((connection: FlowConnection) => {
    const editor = editorRef.current;
    if (!editor || !connection.source || !connection.target) return;

    // 기본적으로 파트너 관계로 추가
    editor.addPartnerConnection(
      connection.source,
      connection.target,
      PartnerStatus.Married
    );

    setEdges((eds) => addEdge(connection, eds));
  }, []);

  // 사람 추가
  const addSubject = useCallback(
    (
      gender: (typeof Gender)[keyof typeof Gender],
      position: { x: number; y: number }
    ) => {
      const editor = editorRef.current;
      if (!editor) return null;

      return editor.addSubject(gender, position, 0);
    },
    []
  );

  // 사람 삭제
  const deleteSubject = useCallback((subjectId: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.deleteSubject(subjectId);
  }, []);

  // Undo/Redo
  const undo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const canUndo = useMemo(() => {
    return editorRef.current?.canUndo() ?? false;
  }, [nodes, edges]);

  const canRedo = useMemo(() => {
    return editorRef.current?.canRedo() ?? false;
  }, [nodes, edges]);

  // 직렬화
  const toJSON = useCallback(() => {
    return editorRef.current?.toJSON() ?? '';
  }, []);

  const fromJSON = useCallback(
    (json: string) => {
      editorRef.current?.fromJSON(json);
      syncFromEditor();
    },
    [syncFromEditor]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addPerson: addSubject,
    deletePerson: deleteSubject,
    undo,
    redo,
    canUndo,
    canRedo,
    toJSON,
    fromJSON,
    editor: editorRef.current,
  };
};
