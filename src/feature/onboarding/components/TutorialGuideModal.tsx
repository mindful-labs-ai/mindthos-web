import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { cn } from '@/lib/cn';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';

interface GuideSlide {
  subtitle: string;
  description: string;
  media: {
    type: 'image' | 'video';
    src: string;
  };
}

interface GuideConfig {
  title: string;
  slides: GuideSlide[];
  /** 마지막 슬라이드의 완료 버튼 텍스트 */
  completeLabel: string;
}

const GUIDE_CONFIGS: Record<number, GuideConfig> = {
  1: {
    title: '가이드 1단계. 상담 기록',
    completeLabel: '상담 기록 예시 확인하기',
    slides: [
      {
        subtitle: '마음토스 상담 기록',
        description:
          '상담이 끝나면 시작되는 또 다른 업무\n상담 기록 정리, 이제는 마음토스로 손쉽게 관리하세요!',
        media: {
          type: 'video',
          src: '/tutorial/mindthos-tutorial-guide-1-1.mp4',
        },
      },
      {
        subtitle: '마음토스 상담 기록',
        description:
          '축어록부터 사례개념화, 기관별 제출 양식에 맞는\n상담노트까지 마음토스가 만들어드려요.',
        media: {
          type: 'video',
          src: '/tutorial/mindthos-tutorial-guide-1-2.mp4',
        },
      },
      {
        subtitle: '마음토스 상담 기록',
        description:
          '가상 내담자 홍길동님의 축어록과 상담노트를\n직접 확인해볼까요? ',
        media: {
          type: 'image',
          src: '/tutorial/mindthos-tutorial-guide-1-3.png',
        },
      },
    ],
  },
  2: {
    title: '가이드 2단계. 다회기 분석',
    completeLabel: '예시 보러가기',
    slides: [
      {
        subtitle: '다회기 AI 슈퍼비전',
        description:
          '슈퍼비전을 받기에는 비용과 시간이 부족하다면\n마음토스의 다회기 분석으로 지난 상담을 돌아보고\n앞으로의 상담을 준비해보세요.',
        media: {
          type: 'video',
          src: '/tutorial/mindthos-tutorial-guide-2-1.mp4',
        },
      },
      {
        subtitle: '다회기 AI 슈퍼비전',
        description:
          '가상 내담자 홍길동님의 다회기 AI 슈퍼비전 보고서를\n직접 확인해볼까요? ',
        media: {
          type: 'image',
          src: '/tutorial/mindthos-tutorial-guide-2-2.png',
        },
      },
    ],
  },
  3: {
    title: '가이드 3단계. 실전! 상담 기록 만들기',
    completeLabel: '업로드하러 가기',
    slides: [
      {
        subtitle: '새로운 상담 기록 만들기',
        description:
          '상담 기록은 상담 녹음 파일을 업로드하거나\n이미 생성된 축어록이 있다면 직접 입력해서 만들 수 있어요.',
        media: {
          type: 'video',
          src: '/tutorial/mindthos-tutorial-guide-3-1.mp4',
        },
      },
      {
        subtitle: '새로운 상담 기록 만들기',
        description:
          '이제 상담 녹음 파일을 직접 업로드해서\n상담 기록을 만들어볼까요?',
        media: {
          type: 'image',
          src: '/tutorial/mindthos-tutorial-guide-3-2.png',
        },
      },
    ],
  },
};

/** 튜토리얼 가이드 에셋 preload */
export const preloadTutorialAssets = () => {
  const allMedia = Object.values(GUIDE_CONFIGS).flatMap((config) =>
    config.slides.map((slide) => slide.media)
  );

  allMedia.forEach(({ type, src }) => {
    if (type === 'video') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    } else {
      const img = new Image();
      img.src = src;
    }
  });
};

export const TutorialGuideModal: React.FC = () => {
  const { tutorialGuideLevel, setTutorialGuideLevel, completeNextStep } =
    useQuestStore();
  const { navigateWithUtm } = useNavigateWithUtm();
  const queryClient = useQueryClient();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [videoProgress, setVideoProgress] = React.useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = React.useState<number | null>(
    null
  );
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const isOpen = tutorialGuideLevel !== null;
  const config = tutorialGuideLevel ? GUIDE_CONFIGS[tutorialGuideLevel] : null;
  const totalSlides = config?.slides.length ?? 0;
  const slide = config?.slides[currentSlide];
  const isLastSlide = currentSlide === totalSlides - 1;

  // 모달 열릴 때 슬라이드 초기화
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setVideoProgress(0);
      setVideoAspectRatio(null);
    }
  }, [isOpen]);

  // 영상 진행도 추적
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [slide?.media.src]);

  const handleClose = () => {
    setTutorialGuideLevel(null);
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    const level = tutorialGuideLevel;
    handleClose();

    const email = useAuthStore.getState().user?.email;

    if (level === 1) {
      if (email) completeNextStep(email);
      navigateWithUtm('/sessions/dummy_session_1');
    } else if (level === 2) {
      if (email) completeNextStep(email);
      navigateWithUtm('/clients/dummy_client_1?tab=analyze');
    } else if (level === 3 && email) {
      // L3→L4 (업로드 준비 단계)
      await completeNextStep(email);

      // 세션이 이미 있으면 바로 L4→L5 완료, 없으면 업로드 모달
      const userId = useAuthStore.getState().userId;
      const cachedSessions = queryClient.getQueryData<{
        sessions: unknown[];
      }>(['sessions', userId ? Number(userId) : 0]);
      const hasSession = (cachedSessions?.sessions?.length ?? 0) > 0;

      if (hasSession) {
        await completeNextStep(email);
      } else {
        useModalStore.getState().openModal('createMultiSession');
      }
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!config || !slide) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      className="h-[848px] max-h-[90vh] w-[872px] max-w-[90vw] border-none p-0"
    >
      <div className="flex h-full flex-col items-center px-0 py-6 sm:px-8 sm:py-8 md:px-14 md:py-[38px]">
        {/* Title */}
        <h2 className="shrink-0 text-xl font-bold text-fg">{config.title}</h2>

        {/* Subtitle */}
        <p className="mt-4 shrink-0 text-base font-semibold text-primary">
          {slide.subtitle}
        </p>

        {/* Media - 남은 공간을 채움 */}
        <div className="mt-4 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
          {slide.media.type === 'video' ? (
            <div
              className="flex max-h-full max-w-full flex-col items-center"
              style={
                videoAspectRatio ? { aspectRatio: videoAspectRatio } : undefined
              }
            >
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-border">
                <video
                  ref={videoRef}
                  key={slide.media.src}
                  className="h-full w-full"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) {
                      setVideoAspectRatio(v.videoWidth / v.videoHeight);
                    }
                  }}
                >
                  <source src={slide.media.src} type="video/mp4" />
                </video>
              </div>
              <div className="mt-2 h-1 w-11/12 shrink-0 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <img
              key={slide.media.src}
              src={slide.media.src}
              alt={slide.subtitle}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Description */}
        <p className="mt-5 shrink-0 whitespace-pre-line text-center text-sm leading-relaxed text-fg">
          {slide.description}
        </p>

        {/* Pagination dots */}
        <div className="mt-5 flex shrink-0 gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i === currentSlide ? 'bg-primary' : 'bg-surface-strong'
              )}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex w-full max-w-[372px] shrink-0 gap-3">
          <Button
            variant="outline"
            tone="neutral"
            size="md"
            className={cn(
              'h-[41px] font-semibold',
              isLastSlide ? 'w-1/4' : 'flex-1'
            )}
            onClick={currentSlide > 0 ? handlePrev : handleClose}
          >
            {currentSlide > 0 ? '이전' : '닫기'}
          </Button>
          <Button
            variant="solid"
            tone="primary"
            size="md"
            className={cn(
              'h-[41px] font-bold',
              isLastSlide ? 'w-3/4' : 'flex-1'
            )}
            onClick={handleNext}
          >
            {isLastSlide ? config.completeLabel : '다음'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
