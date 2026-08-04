import { useEffect, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import { ROUTES } from '@/app/router/constants';
import { useSignupCheck } from '@/features/auth/hooks/useSignupCheck';
import {
  COHORT_SURVEY_OPTIONS,
  type CohortSurveyChoices,
} from '@/features/onboarding/constants/cohortSurvey';
import { TUTORIAL_HAS_RECORD_STORAGE_KEY } from '@/features/onboarding/constants/tutorialStorage';
import {
  useCohortSurveyCheck,
  cohortSurveyQueryKeys,
} from '@/features/onboarding/hooks/useCohortSurveyCheck';
import { cn } from '@/lib/cn';
import { captureCohortSurvey } from '@/shared/api/server/acquisitionServerApi';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Button, Spinner } from '@/shared/ui';
import { useToast } from '@/shared/ui/composites/Toast';

const TUTORIAL_CHARACTER_SRC = '/tutorial/tutorial-character.png';

const CHARACTER_MESSAGES = {
  clientType: {
    empty: '마음토스에 가입하신 걸\n환영합니다!',
    selected: '상담자 선생님에게 딱 맞는\n환경을 준비하고 있어요.',
  },
  therapyTheory:
    '마음토스는 각 이론별 전문가와\n협업하여 10개 이상의 상담 이론별\n사례개념화 노트를 지원하고 있어요.',
} as const;

const QUESTIONS = [
  {
    key: 'clientType',
    title: '주로 어떤 내담자를 상담하시나요?',
    options: COHORT_SURVEY_OPTIONS.clientType,
    nextLabel: '다음',
  },
  {
    key: 'therapyTheory',
    title: '주로 사용하는 상담 이론은 무엇인가요?',
    options: COHORT_SURVEY_OPTIONS.therapyTheory,
    nextLabel: '다음',
  },
  {
    key: 'hasRecord',
    title:
      '현재 업로드할 수 있는 내담자의 상담기록(축어록 혹은 음성파일) 사례가 있으신가요?',
    options: COHORT_SURVEY_OPTIONS.hasRecord,
    nextLabel: '마음토스 시작하기',
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]['key'];
type ChoiceMap = Record<QuestionKey, number | null>;

const INITIAL_CHOICES: ChoiceMap = {
  clientType: null,
  therapyTheory: null,
  hasRecord: null,
};

export default function CohortSurveyPage() {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    required,
    isLoading: isSignupLoading,
    isError: isSignupError,
  } = useSignupCheck();
  const {
    completed,
    isLoading: isSurveyLoading,
    isError: isSurveyError,
    refetch,
  } = useCohortSurveyCheck(!isSignupLoading && !isSignupError && !required);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choices, setChoices] = useState<ChoiceMap>(INITIAL_CHOICES);

  const question = QUESTIONS[questionIndex];
  const selectedChoice = choices[question.key];
  const characterMessage =
    question.key === 'clientType'
      ? selectedChoice === null
        ? CHARACTER_MESSAGES.clientType.empty
        : CHARACTER_MESSAGES.clientType.selected
      : CHARACTER_MESSAGES.therapyTheory;
  const showCharacter = characterMessage !== null;

  useEffect(() => {
    if (!isSignupLoading && !isSignupError && required) {
      navigateWithUtm(ROUTES.USER_VERIFY, { replace: true });
    }
  }, [isSignupError, isSignupLoading, navigateWithUtm, required]);

  useEffect(() => {
    if (!isSurveyLoading && !isSurveyError && completed) {
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    }
  }, [completed, isSurveyError, isSurveyLoading, navigateWithUtm]);

  const surveyMutation = useMutation({
    mutationFn: (nextChoices: CohortSurveyChoices) =>
      captureCohortSurvey(nextChoices),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cohortSurveyQueryKeys.status(),
      });
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    },
    onError: (error) => {
      toast({
        title: '응답을 저장하지 못했어요.',
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
      });
    },
  });

  const completeChoices = useMemo(() => {
    if (
      choices.clientType === null ||
      choices.therapyTheory === null ||
      choices.hasRecord === null
    ) {
      return null;
    }
    return {
      clientType: choices.clientType,
      therapyTheory: choices.therapyTheory,
      hasRecord: choices.hasRecord,
    } satisfies CohortSurveyChoices;
  }, [choices]);

  const handleNext = () => {
    if (selectedChoice === null || surveyMutation.isPending) return;

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    if (completeChoices) {
      window.sessionStorage.setItem(
        TUTORIAL_HAS_RECORD_STORAGE_KEY,
        String(completeChoices.hasRecord === 1)
      );
      surveyMutation.mutate(completeChoices);
    }
  };

  if (isSignupLoading || isSurveyLoading || required || completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-contrast">
        <Spinner />
      </div>
    );
  }

  if (isSignupError || isSurveyError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-contrast px-6 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4">
          <p className="typo-m text-fg">질문 화면을 불러오지 못했어요.</p>
          <Button tone="primary" onClick={() => void refetch()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-start overflow-x-hidden bg-surface-contrast px-4 py-6 sm:px-8 sm:py-10 lg:block lg:px-12 lg:py-20">
      <div
        className={cn(
          'relative mx-auto flex w-full items-center',
          showCharacter
            ? 'min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-10rem)]'
            : 'min-h-screen'
        )}
      >
        <section
          className={cn(
            'relative z-10 mx-auto flex w-full flex-col',
            'min-h-[calc(100vh-3rem)] max-w-[774px] rounded-2xl border border-grey-40 bg-surface px-5 py-10 shadow-subtle sm:min-h-[calc(100vh-5rem)] sm:px-10 sm:py-12 lg:min-h-[calc(100vh-10rem)] lg:px-[57px] lg:py-[80px]'
          )}
          aria-labelledby="cohort-survey-title"
        >
          <h1 className="text-center text-[32px] font-headline leading-tight text-fg sm:text-[34px]">
            마음토스 시작하기
          </h1>

          <h2
            id="cohort-survey-title"
            className="mt-2 text-center text-[20px] font-headline leading-[1.45] text-fg-muted sm:mt-3 sm:text-[23px] lg:mt-10"
          >
            {question.title}
          </h2>

          <div className="mx-auto flex w-full max-w-[660px] flex-1 flex-col justify-center">
            <div className="mt-12 flex flex-col gap-4 lg:mt-[86px]">
              {question.options.map((option) => {
                const isSelected = selectedChoice === option.choice;
                return (
                  <button
                    key={option.choice}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setChoices((current) => ({
                        ...current,
                        [question.key]: option.choice,
                      }))
                    }
                    className={cn(
                      'relative flex min-h-[72px] items-center justify-center rounded-2xl border px-14 text-center transition-colors sm:min-h-[88px] sm:px-16',
                      isSelected
                        ? 'border-green-80 bg-green-10 text-fg'
                        : 'border-grey-40 bg-surface text-fg lg:hover:bg-surface-contrast'
                    )}
                  >
                    <span className="text-[16px] font-headline leading-snug sm:text-[18px]">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        'absolute left-5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full',
                        isSelected
                          ? 'bg-green-80 text-white'
                          : 'bg-grey-40 text-white'
                      )}
                      aria-hidden="true"
                    >
                      <Check size={17} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              tone="primary"
              size="lg"
              className="mx-auto mt-12 h-12 w-full max-w-[375px] rounded-lg text-[18px] font-headline sm:mt-16"
              disabled={selectedChoice === null}
              loading={surveyMutation.isPending}
              onClick={handleNext}
            >
              {question.nextLabel}
            </Button>
          </div>
        </section>

        {showCharacter && (
          <aside className="pointer-events-none hidden lg:fixed lg:bottom-0 lg:right-[clamp(1rem,6vw,8rem)] lg:z-20 lg:mx-0 lg:mt-0 lg:flex lg:w-[340px] lg:max-w-none lg:flex-col lg:items-center lg:justify-end lg:gap-0">
            <div className="relative z-10 mb-20 w-[190px] whitespace-pre-line rounded-2xl bg-[#d6efd8] px-4 py-7 text-center text-[14px] font-headline leading-[1.55] text-fg sm:w-[240px] sm:px-5 sm:py-8 lg:mb-16 lg:w-[296px] lg:px-6 lg:py-8 lg:text-[15px]">
              {characterMessage}
              <span
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 border-x-[14px] border-t-[28px] border-x-transparent border-t-[#d6efd8]"
                aria-hidden="true"
              />
            </div>
            <img
              src={TUTORIAL_CHARACTER_SRC}
              alt="마음토스 상담 가이드 캐릭터"
              className="h-auto w-[116px] object-contain sm:w-[146px] lg:w-[390px]"
            />
          </aside>
        )}
      </div>
    </main>
  );
}
