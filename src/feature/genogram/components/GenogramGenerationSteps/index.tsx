import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { cn } from '@/lib/cn';

import type { AIGenogramOutput } from '../../utils/aiJsonConverter';
import { AnalyzeLoadingAnimation } from '../GenogramLoadingAnimation';

import { ConfirmStep } from './ConfirmStep';
import { FamilyMemberListStep } from './FamilyMemberListStep';
import { RenderStep } from './RenderStep';
import { stepToIndex, type GenogramStep } from './types';

interface GenogramGenerationStepsProps {
  currentStep: GenogramStep;
  isLoading: boolean;
  error: string | null;
  aiOutput: AIGenogramOutput | null;
  clientName?: string;
  /** render 단계에서 캔버스 로딩 중 여부 */
  isRenderPending?: boolean;
  /** 편집 모드 여부 (애니메이션 대기 건너뛰기) */
  isEditMode?: boolean;

  // 콜백
  onConfirm: () => void;
  onAiOutputChange: (data: AIGenogramOutput) => void;
  onNextToRender: () => void;
  onComplete: () => void;
  onCancel?: () => void;
  /** 편집 모드에서 취소 시 콜백 (edit 단계 전용) */
  onEditCancel?: () => void;
}

export function GenogramGenerationSteps({
  currentStep,
  isLoading,
  error,
  aiOutput,
  clientName,
  isRenderPending = false,
  isEditMode = false,
  onConfirm,
  onAiOutputChange,
  onNextToRender,
  onComplete,
  onCancel,
  onEditCancel,
}: GenogramGenerationStepsProps) {
  const stepIndex = stepToIndex(currentStep);

  // edit 단계: analyze와 동일한 UI (스테퍼 없음)
  if (currentStep === 'edit') {
    // 콘텐츠 렌더링
    const renderEditContent = () => {
      // 에러 발생 시
      if (error) {
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="mt-4 text-center text-lg font-medium text-fg">
              오류가 발생했습니다
            </p>
            <p className="mt-2 text-center text-sm text-fg-muted">{error}</p>
            {onEditCancel && (
              <Button variant="outline" className="mt-6" onClick={onEditCancel}>
                돌아가기
              </Button>
            )}
          </div>
        );
      }

      // 로딩 중
      if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AnalyzeLoadingAnimation />
          </div>
        );
      }

      // 데이터 있음
      if (aiOutput) {
        return (
          <FamilyMemberListStep
            data={aiOutput}
            onChange={onAiOutputChange}
            onNext={onNextToRender}
            buttonText="가계도에 적용하기"
            isEditMode
          />
        );
      }

      // 대기 중
      return (
        <div className="py-8 text-center text-fg-muted">
          데이터를 불러오는 중...
        </div>
      );
    };

    return (
      <div className="flex h-full flex-col items-center justify-center overflow-hidden p-8">
        <div className="flex h-[90%] w-full max-w-[min(90%,1018px)] flex-col rounded-xl border border-border bg-surface p-6 shadow-lg">
          {/* 콘텐츠 (스테퍼 없음) */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderEditContent()}
          </div>
        </div>
      </div>
    );
  }

  // render 단계: 전체 화면 모달로 표시
  if (currentStep === 'render') {
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-hidden p-8">
        <div className="flex w-full max-w-md flex-col rounded-xl border border-border bg-surface p-8 shadow-lg">
          <RenderStep
            error={error}
            isPending={isRenderPending}
            onComplete={onComplete}
            onCancel={onCancel}
            isEditMode={isEditMode}
          />
        </div>
      </div>
    );
  }

  // confirm 또는 analyze 단계의 콘텐츠
  const renderStepContent = () => {
    // 에러 발생 시 - 첫 화면으로 돌아가기
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-center text-lg font-medium text-fg">
            오류가 발생했습니다
          </p>
          <p className="mt-2 text-center text-sm text-fg-muted">{error}</p>
          {onCancel && (
            <Button variant="outline" className="mt-6" onClick={onCancel}>
              돌아가기
            </Button>
          )}
        </div>
      );
    }

    // confirm 단계
    if (currentStep === 'confirm') {
      return <ConfirmStep onConfirm={onConfirm} />;
    }

    // analyze 단계 - 로딩 중
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AnalyzeLoadingAnimation />
        </div>
      );
    }

    // analyze 단계 - 데이터 있음
    if (aiOutput) {
      return (
        <FamilyMemberListStep
          data={aiOutput}
          onChange={onAiOutputChange}
          onNext={onNextToRender}
        />
      );
    }

    // analyze 단계 - 대기 중
    return (
      <div className="py-8 text-center text-fg-muted">
        데이터를 불러오는 중...
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex h-[90%] w-full max-w-[min(90%,1018px)] flex-col rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="mb-4 shrink-0 text-xl font-semibold text-fg">
          {clientName
            ? `${clientName}님의 상담기록으로 자동 생성하기`
            : '상담기록으로 자동 생성하기'}
        </h2>

        {/* 커스텀 스테퍼 */}
        <div className="flex shrink-0 select-none flex-col items-center py-4">
          {/* 원형 배지 + 연결선 */}
          <div className="flex items-center">
            {/* Step 1 배지 */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
                stepIndex >= 0
                  ? 'bg-primary text-white'
                  : 'border-2 border-border text-fg-muted'
              )}
            >
              1
            </div>

            {/* 연결선 */}
            <div
              className={cn(
                'h-0.5 w-52',
                stepIndex >= 1 ? 'bg-primary' : 'bg-border'
              )}
            />

            {/* Step 2 배지 */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
                stepIndex >= 1
                  ? 'bg-primary text-white'
                  : 'border-2 border-border text-fg-muted'
              )}
            >
              2
            </div>
          </div>

          {/* 라벨 */}
          <div className="mt-2 flex items-start">
            <span className="w-40 text-center text-sm text-fg">
              1단계 : 가족 구성원 분석
            </span>
            <div className="w-24" />
            <span className="w-40 text-center text-sm text-fg">
              2단계 : 가계도 그리기
            </span>
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-hidden">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

export { type GenogramStep } from './types';
