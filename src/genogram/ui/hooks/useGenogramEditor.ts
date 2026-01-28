import { useEffect, useRef } from 'react';

import { GenogramEditor } from '@/genogram/core/editor/genogram-editor';
import type { EditorEventType } from '@/genogram/core/editor/genogram-editor';

import { DEFAULT_NODE_SIZE } from '../constants/grid';

export interface UseGenogramEditorOptions {
  initialData?: string;
  onEvent?: (eventType: EditorEventType) => void;
}

/**
 * GenogramEditor 인스턴스의 생명주기를 관리하는 훅.
 * - 마운트 시 Editor 생성, 초기 데이터 로드, 이벤트 구독
 * - 언마운트 시 구독 해제 및 dispose
 */
export const useGenogramEditor = (options: UseGenogramEditorOptions = {}) => {
  const editorRef = useRef<GenogramEditor | null>(null);
  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;

  useEffect(() => {
    const editor = new GenogramEditor({
      layout: {
        nodeWidth: DEFAULT_NODE_SIZE,
        nodeHeight: DEFAULT_NODE_SIZE,
        horizontalGap: 100,
        verticalGap: 120,
      },
      commandManager: {
        maxHistorySize: 50,
      },
    });

    if (options.initialData) {
      try {
        editor.fromJSON(options.initialData);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    }

    editorRef.current = editor;

    const unsubscribe = editor.on((eventType) => {
      onEventRef.current?.(eventType);
    });

    return () => {
      unsubscribe();
      editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEditor = () => editorRef.current;

  return { editorRef, getEditor };
};
