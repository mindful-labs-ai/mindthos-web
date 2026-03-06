import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { cn } from '@/lib/cn';
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
}

const GUIDE_CONFIGS: Record<number, GuideConfig> = {
  1: {
    title: '가이드 1단계. 상담 기록',
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

export const TutorialGuideModal: React.FC = () => {
  const { tutorialGuideLevel, setTutorialGuideLevel } = useQuestStore();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const isOpen = tutorialGuideLevel !== null;
  const config = tutorialGuideLevel ? GUIDE_CONFIGS[tutorialGuideLevel] : null;
  const totalSlides = config?.slides.length ?? 0;
  const slide = config?.slides[currentSlide];

  // 모달 열릴 때 슬라이드 초기화
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setTutorialGuideLevel(null);
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!config || !slide) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      className="max-w-[640px] border-none p-0"
    >
      <div className="flex flex-col items-center px-8 pb-8 pt-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-fg">{config.title}</h2>

        {/* Subtitle */}
        <p className="mt-4 text-base font-semibold text-primary">
          {slide.subtitle}
        </p>

        {/* Media */}
        <div className="mt-4 w-full overflow-hidden rounded-xl bg-surface-contrast">
          {slide.media.type === 'video' ? (
            <video
              key={slide.media.src}
              className="aspect-video w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={slide.media.src} type="video/mp4" />
            </video>
          ) : (
            <img
              key={slide.media.src}
              src={slide.media.src}
              alt={slide.subtitle}
              className="aspect-video w-full object-cover"
            />
          )}
        </div>

        {/* Description */}
        <p className="mt-5 whitespace-pre-line text-center text-sm leading-relaxed text-fg">
          {slide.description}
        </p>

        {/* Pagination dots */}
        <div className="mt-5 flex gap-2">
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
        <div className="mt-6 flex w-full gap-3">
          <Button
            variant="outline"
            tone="neutral"
            size="lg"
            className="flex-1 font-semibold"
            onClick={currentSlide > 0 ? handlePrev : handleClose}
          >
            {currentSlide > 0 ? '이전' : '닫기'}
          </Button>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            className="flex-1 font-bold"
            onClick={handleNext}
          >
            {currentSlide < totalSlides - 1 ? '다음' : '완료'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
