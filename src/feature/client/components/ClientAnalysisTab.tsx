import React, { useState } from 'react';

import Markdown from 'react-markdown';

import type { TabItem } from '@/components/ui/atoms/Tab';
import { Tab } from '@/components/ui/atoms/Tab';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import type { SelectItem } from '@/components/ui/composites/Select';
import { Select } from '@/components/ui/composites/Select';
import { useToast } from '@/components/ui/composites/Toast';
import { CheckIcon, CopyIcon } from '@/shared/icons';

import type {
  ClientAnalysis,
  ClientAnalysisType,
  ClientAnalysisVersion,
} from '../types/clientAnalysis.types';

interface ClientAnalysisTabProps {
  analyses: ClientAnalysisVersion[];
  isLoading?: boolean;
}

// 분석 타입별 한글 제목
const ANALYSIS_TYPE_LABELS: Record<ClientAnalysisType, string> = {
  ai_supervision: 'AI 수퍼비전',
  profiling: '프로파일링',
  psychotherapy_plan: '심리치료계획',
};

export const ClientAnalysisTab: React.FC<ClientAnalysisTabProps> = ({
  analyses,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<number>(
    analyses[0]?.version || 0
  );
  const [activeAnalysisTab, setActiveAnalysisTab] =
    useState<ClientAnalysisType>('ai_supervision');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 선택된 버전의 분석 데이터
  const currentAnalysis = analyses.find((a) => a.version === selectedVersion);

  // 버전 선택 아이템
  const versionItems: SelectItem[] = analyses.map((analysis) => ({
    value: String(analysis.version),
    label: (
      <div className="flex flex-col">
        <span className="font-medium">
          {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <span className="text-xs text-fg-muted">
          버전 {analysis.version} / {analysis.session_ids.length}개 회기
        </span>
      </div>
    ),
  }));

  // 탭 아이템
  const tabItems: TabItem[] = [
    {
      value: 'ai_supervision',
      label: ANALYSIS_TYPE_LABELS.ai_supervision,
    },
    {
      value: 'profiling',
      label: ANALYSIS_TYPE_LABELS.profiling,
    },
    {
      value: 'psychotherapy_plan',
      label: ANALYSIS_TYPE_LABELS.psychotherapy_plan,
    },
  ];

  // 클립보드 복사
  const handleCopy = async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);

      toast({
        title: '복사 완료',
        description: '클립보드에 내용이 복사되었습니다.',
        duration: 2000,
      });

      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '내용을 복사하는 데 실패했습니다.',
        duration: 3000,
      });
    }
  };

  // 분석 내용 렌더링
  const renderAnalysisContent = (analysis: ClientAnalysis | null) => {
    // 로딩 상태
    if (analysis?.status === 'pending' || analysis?.status === 'in_progress') {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <Text className="text-fg-muted">분석 중...</Text>
        </div>
      );
    }

    // 실패 상태
    if (analysis?.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <Text className="text-danger">
            {analysis.error_message || '분석에 실패했습니다.'}
          </Text>
        </div>
      );
    }

    // 완료 상태
    if (analysis?.status === 'succeeded' && analysis.content) {
      return (
        <div className="relative">
          {/* 전체 복사 버튼 */}
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                handleCopy(analysis.content || '', `${activeAnalysisTab}-full`)
              }
              className="group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
              aria-label="전체 복사"
            >
              {copiedKey === `${activeAnalysisTab}-full` ? (
                <>
                  <CheckIcon size={18} className="text-success" />
                  <span className="text-success">복사됨</span>
                </>
              ) : (
                <>
                  <CopyIcon size={18} />
                  <span>전체 복사</span>
                </>
              )}
            </button>
          </div>

          {/* 마크다운 렌더링 */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-start">
            <Markdown
              components={{
                h1: ({ children }: any) => (
                  <Title
                    as="h1"
                    className="mb-4 mt-8 text-2xl font-bold text-fg first:mt-0"
                  >
                    {children}
                  </Title>
                ),
                h2: ({ children }: any) => (
                  <Title
                    as="h2"
                    className="mb-3 mt-6 text-xl font-semibold text-fg first:mt-0"
                  >
                    {children}
                  </Title>
                ),
                h3: ({ children }: any) => (
                  <Title
                    as="h3"
                    className="mb-2 mt-4 text-lg font-semibold text-fg first:mt-0"
                  >
                    {children}
                  </Title>
                ),
                p: ({ children }: any) => (
                  <Text className="mb-4 leading-relaxed text-fg">
                    {children}
                  </Text>
                ),
                ul: ({ children }: any) => (
                  <ul className="mb-4 list-disc space-y-1 pl-6 text-fg">
                    {children}
                  </ul>
                ),
                ol: ({ children }: any) => (
                  <ol className="mb-4 list-decimal space-y-1 pl-6 text-fg">
                    {children}
                  </ol>
                ),
                li: ({ children }: any) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }: any) => (
                  <strong className="font-semibold text-fg">{children}</strong>
                ),
                em: ({ children }: any) => (
                  <em className="italic text-fg">{children}</em>
                ),
                blockquote: ({ children }: any) => (
                  <blockquote className="mb-4 border-l-4 border-primary pl-4 italic text-fg-muted">
                    {children}
                  </blockquote>
                ),
                code: ({ children }: any) => (
                  <code className="rounded bg-surface-contrast px-1.5 py-0.5 font-mono text-sm text-fg">
                    {children}
                  </code>
                ),
                pre: ({ children }: any) => (
                  <pre className="mb-4 overflow-x-auto rounded-lg bg-surface-contrast p-4">
                    {children}
                  </pre>
                ),
              }}
            >
              {analysis.content}
            </Markdown>
          </div>
        </div>
      );
    }

    // 데이터 없음
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Text className="text-fg-muted">분석 결과가 없습니다.</Text>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        <Text className="text-fg-muted">분석 데이터를 불러오는 중...</Text>
      </div>
    );
  }

  // 빈 상태
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 text-6xl">📊</div>
        <Title as="h3" className="mb-2 text-xl font-bold text-fg">
          분석 기록이 없습니다
        </Title>
        <Text className="text-center text-fg-muted">
          우측 상단의 "클라이언트 분석" 버튼을 눌러
          <br />
          세션 분석을 시작해보세요.
        </Text>
      </div>
    );
  }

  return (
    <div className="">
      {/* 버전 선택 + 탭 */}
      <div className="flex items-center justify-between px-8">
        {/* 탭 */}
        <Tab
          items={tabItems}
          value={activeAnalysisTab}
          onValueChange={(value) =>
            setActiveAnalysisTab(value as ClientAnalysisType)
          }
          variant="underline"
          size="md"
        />

        {/* 버전 선택 */}
        {analyses.length > 1 && (
          <div className="w-64">
            <Select
              items={versionItems}
              value={String(selectedVersion)}
              onChange={(value) => setSelectedVersion(Number(value))}
              placeholder="버전 선택"
            />
          </div>
        )}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[400px] rounded-lg border border-border bg-surface p-6">
        {currentAnalysis &&
          renderAnalysisContent(currentAnalysis.analyses[activeAnalysisTab])}
      </div>
    </div>
  );
};
