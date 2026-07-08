/**
 * 축어록 찾기·바꾸기 바 (편집 모드 전용)
 * 이 축어록 텍스트에서만 치환하며, 태그(비언어/비식별) 안은 보호한다.
 */
import React from 'react';

import { X } from 'lucide-react';

import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { useToast } from '@/shared/ui/composites/Toast';

interface TranscriptFindReplaceBarProps {
  /** 모두 바꾸기 — 총 치환 횟수 반환 */
  onReplaceAll: (find: string, replaceWith: string) => number;
  /** 현재 검색어의 매치 개수 */
  getMatchCount: (find: string) => number;
  /** 치환/undo 등으로 내용이 바뀌면 매치 수 재계산용 (editorVersion) */
  matchRefreshKey: number;
  onClose: () => void;
}

export const TranscriptFindReplaceBar: React.FC<
  TranscriptFindReplaceBarProps
> = ({ onReplaceAll, getMatchCount, matchRefreshKey, onClose }) => {
  const { toast } = useToast();
  const [find, setFind] = React.useState('');
  const [replaceWith, setReplaceWith] = React.useState('');

  const matchCount = React.useMemo(() => {
    void matchRefreshKey; // 치환/undo 후 내용 변화 시 재계산 트리거
    return find ? getMatchCount(find) : 0;
  }, [find, getMatchCount, matchRefreshKey]);

  const handleReplaceAll = () => {
    if (!find) return;
    const count = onReplaceAll(find, replaceWith);
    toast({
      title: count > 0 ? '바꾸기 완료' : '결과 없음',
      description:
        count > 0 ? `${count}곳을 바꿨어요.` : '바꿀 내용을 찾지 못했어요.',
      duration: 3000,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReplaceAll();
    }
  };

  return (
    <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-grey-30 bg-white px-3 py-2 shadow-sm">
      <Input
        size="sm"
        value={find}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="찾기 (예: 정민)"
        className="w-36"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
      <Input
        size="sm"
        value={replaceWith}
        onChange={(e) => setReplaceWith(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="바꾸기 (예: 경민)"
        className="w-36"
      />
      <span className="typo-sm min-w-[3rem] text-grey-70">
        {find ? `${matchCount}곳` : ''}
      </span>
      <Button
        size="sm"
        variant="solid"
        tone="primary"
        onClick={handleReplaceAll}
        disabled={!find || matchCount === 0}
      >
        모두 바꾸기
      </Button>
      <button
        type="button"
        onClick={onClose}
        aria-label="찾기 바꾸기 닫기"
        className="ml-auto rounded-md p-1 text-grey-60 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
