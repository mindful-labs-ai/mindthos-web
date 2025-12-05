import React, { useState } from 'react';

import Markdown from 'react-markdown';

import type { TabItem } from '@/components/ui/atoms/Tab';
import { Tab } from '@/components/ui/atoms/Tab';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import type { SelectItem } from '@/components/ui/composites/Select';
import { Select } from '@/components/ui/composites/Select';
import { useToast } from '@/components/ui/composites/Toast';
import { CheckIcon } from '@/shared/icons';

import type {
  ClientAnalysis,
  ClientAnalysisVersion,
} from '../types/clientAnalysis.types';

interface ClientAnalysisTabProps {
  analyses: ClientAnalysisVersion[];
  isLoading?: boolean;
  onCreateAnalysis?: () => void;
}

export const ClientAnalysisTab: React.FC<ClientAnalysisTabProps> = ({
  analyses,
  isLoading = false,
  onCreateAnalysis,
}) => {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<number>(
    analyses[0]?.version || 0
  );
  const [activeTab, setActiveTab] = useState<string>('ai_supervision');
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

  // 클립보드 복사
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey('ai_supervision');

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
    // 로딩 상태 - 진행 중인 경우
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
            {onCreateAnalysis && (
              <button
                type="button"
                onClick={onCreateAnalysis}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary-100 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-200"
              >
                수퍼비전 다시 받기
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCopy(analysis.content || '')}
              className="group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
              aria-label="전체 복사"
            >
              {copiedKey === 'ai_supervision' ? (
                <>
                  <CheckIcon size={18} className="text-success" />
                  <span className="text-success">복사됨</span>
                </>
              ) : (
                <>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 4C13 4.26522 13.1054 4.51957 13.2929 4.70711C13.4804 4.89464 13.7348 5 14 5H17.966C17.8924 4.35068 17.6074 3.74354 17.155 3.272L14.871 0.913C14.3714 0.406548 13.7085 0.0933745 13 0.029V4ZM11 4V0H7C5.67441 0.00158786 4.40356 0.528882 3.46622 1.46622C2.52888 2.40356 2.00159 3.67441 2 5V15C2.00159 16.3256 2.52888 17.5964 3.46622 18.5338C4.40356 19.4711 5.67441 19.9984 7 20H13C14.3256 19.9984 15.5964 19.4711 16.5338 18.5338C17.4711 17.5964 17.9984 16.3256 18 15V7H14C13.2044 7 12.4413 6.68393 11.8787 6.12132C11.3161 5.55871 11 4.79565 11 4ZM17 24H8C7.73478 24 7.48043 23.8946 7.29289 23.7071C7.10536 23.5196 7 23.2652 7 23C7 22.7348 7.10536 22.4804 7.29289 22.2929C7.48043 22.1054 7.73478 22 8 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V8C20 7.73478 20.1054 7.48043 20.2929 7.29289C20.4804 7.10536 20.7348 7 21 7C21.2652 7 21.5196 7.10536 21.7071 7.29289C21.8946 7.48043 22 7.73478 22 8V19C21.9984 20.3256 21.4711 21.5964 20.5338 22.5338C19.5964 23.4711 18.3256 23.9984 17 24Z"
                      fill="#BABAC0"
                    />
                  </svg>
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

  // 탭 아이템 정의
  const tabItems: TabItem[] = [
    {
      value: 'ai_supervision',
      label: 'AI 수퍼비전',
    },
    {
      value: 'profiling',
      label: (
        <span className="flex items-center gap-1.5">
          프로파일링
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.0827 4.914V4.08332C11.0827 1.82818 9.25452 0 6.99934 0C4.74416 0 2.91602 1.82818 2.91602 4.08332V4.914C1.85437 5.37734 1.16755 6.42499 1.16602 7.58332V11.0833C1.16793 12.6934 2.47264 13.9981 4.08266 14H9.91599C11.526 13.9981 12.8307 12.6934 12.8327 11.0833V7.58332C12.8312 6.42499 12.1443 5.37734 11.0827 4.914ZM7.58266 9.91668C7.58266 10.2388 7.3215 10.5 6.99934 10.5C6.67718 10.5 6.41602 10.2388 6.41602 9.91668V8.75C6.41602 8.42784 6.67718 8.16668 6.99934 8.16668C7.3215 8.16668 7.58266 8.42784 7.58266 8.75V9.91668ZM9.91602 4.66668H4.08266V4.08335C4.08266 2.47253 5.38849 1.16668 6.99934 1.16668C8.61019 1.16668 9.91602 2.4725 9.91602 4.08335V4.66668Z"
              fill="#C6C5D5"
            />
          </svg>
        </span>
      ),
      disabled: true,
    },
    {
      value: 'psychotherapy_plan',
      label: (
        <span className="flex items-center gap-1.5">
          심리치료계획
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.0827 4.914V4.08332C11.0827 1.82818 9.25452 0 6.99934 0C4.74416 0 2.91602 1.82818 2.91602 4.08332V4.914C1.85437 5.37734 1.16755 6.42499 1.16602 7.58332V11.0833C1.16793 12.6934 2.47264 13.9981 4.08266 14H9.91599C11.526 13.9981 12.8307 12.6934 12.8327 11.0833V7.58332C12.8312 6.42499 12.1443 5.37734 11.0827 4.914ZM7.58266 9.91668C7.58266 10.2388 7.3215 10.5 6.99934 10.5C6.67718 10.5 6.41602 10.2388 6.41602 9.91668V8.75C6.41602 8.42784 6.67718 8.16668 6.99934 8.16668C7.3215 8.16668 7.58266 8.42784 7.58266 8.75V9.91668ZM9.91602 4.66668H4.08266V4.08335C4.08266 2.47253 5.38849 1.16668 6.99934 1.16668C8.61019 1.16668 9.91602 2.4725 9.91602 4.08335V4.66668Z"
              fill="#C6C5D5"
            />
          </svg>
        </span>
      ),
      disabled: true,
    },
  ];

  // 빈 상태
  if (analyses.length === 0) {
    return (
      <div className="">
        {/* 탭 + 버전 선택 + 다회기 분석 버튼 */}
        <div className="flex items-center justify-between px-8">
          {/* 탭 영역 */}
          <div className="flex items-center gap-4">
            <Tab
              items={tabItems}
              value={activeTab}
              onValueChange={setActiveTab}
              variant="underline"
              size="md"
            />
          </div>

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

        {/* 분석 내용 */}
        <div className="relative min-h-[400px] rounded-lg border border-border bg-surface p-6">
          <Title as="h4" className="mb-8 text-left text-sm text-fg-muted">
            수퍼비전 보고서
          </Title>
          <Text className="text-center font-medium text-fg-muted">
            아직 분석 기록이 없습니다.
          </Text>{' '}
          {onCreateAnalysis && (
            <button
              type="button"
              onClick={onCreateAnalysis}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-primary bg-primary-100 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-200"
            >
              AI 수퍼비전 받기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* 탭 + 버전 선택 + 다회기 분석 버튼 */}
      <div className="flex items-center justify-between px-8">
        {/* 탭 영역 */}
        <div className="flex items-center gap-4">
          <Tab
            items={tabItems}
            value={activeTab}
            onValueChange={setActiveTab}
            variant="underline"
            size="md"
          />
        </div>

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

      {/* 분석 내용 */}
      <div className="min-h-[400px] rounded-lg border border-border bg-surface p-6">
        {currentAnalysis &&
          renderAnalysisContent(currentAnalysis.ai_supervision)}
      </div>
    </div>
  );
};
