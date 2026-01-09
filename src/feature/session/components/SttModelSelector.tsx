import React from 'react';

import { Text } from '@/components/ui';
import { Tooltip } from '@/components/ui/composites/Tooltip';

import type { SttModel } from '../types';

interface SttModelSelectorProps {
  sttModel: SttModel;
  setSttModel: React.Dispatch<React.SetStateAction<SttModel>>;
}

const SttModelSelector = ({ sttModel, setSttModel }: SttModelSelectorProps) => {
  return (
    <div className="flex gap-3 sm:flex-row md:flex-col lg:flex-row">
      <button
        type="button"
        onClick={() => setSttModel('whisper')}
        className={`h-[133px] w-[182px] flex-1 rounded-lg border-2 p-4 transition-all ${
          sttModel === 'whisper'
            ? 'border-primary'
            : 'border-border bg-bg hover:border-fg-muted'
        }`}
      >
        <div className="flex h-full flex-col justify-start">
          <div className="flex flex-1 flex-col justify-stretch text-left">
            <Text
              className={`mb-1 font-semibold ${
                sttModel === 'whisper' ? 'text-primary' : 'text-fg'
              }`}
            >
              일반 축어록
            </Text>
            <Text className="text-xs text-fg-muted">
              1:1 개인 상담 추천
              <br />
              빠른 작성 속도, 준수한 정확도
            </Text>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Text className="text-sm font-semibold text-fg">분당 1</Text>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-fg"
                >
                  <g clipPath="url(#clip0_credit)">
                    <path
                      d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_credit">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  sttModel === 'whisper'
                    ? 'border-primary bg-primary'
                    : 'border-border bg-bg'
                }`}
              >
                {sttModel === 'whisper' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* 고급 축어록 (Gemini) */}
      <button
        type="button"
        onClick={() => setSttModel('gemini-3')}
        className={`h-[133px] w-[182px] flex-1 rounded-lg border-2 p-4 transition-all ${
          sttModel === 'gemini-3'
            ? 'border-primary'
            : 'border-border bg-bg hover:border-fg-muted'
        }`}
      >
        <div className="flex h-full flex-col justify-start">
          <div className="flex flex-1 flex-col justify-stretch text-left">
            <div className="mb-1 flex items-start justify-between">
              <Text
                className={`font-semibold ${
                  sttModel === 'gemini-3' ? 'text-primary' : 'text-fg'
                }`}
              >
                고급 축어록
              </Text>
              <Tooltip
                placement="top"
                content={
                  <div className="space-y-3 p-2 text-left">
                    <Text className="text-base font-medium text-fg">
                      고급 축어록
                    </Text>
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-200 text-6xl font-bold text-red-600">
                      <img
                        src="/example_image/advanced_STT_image.png"
                        alt="고급 축어록 툴팁"
                        className="object-contain"
                      />
                    </div>
                    <Text className="text-xs leading-relaxed text-fg-muted">
                      <p className="font-semibold">숨소리까지 기록:</p> 침묵,
                      한숨, 웃음, 울음 등 상담의 맥락을 결정짓는 비언어적 표현을
                      놓치지 않습니다.
                      <br />
                      <p className="font-semibold">완벽한 화자 분리:</p>{' '}
                      목소리가 겹치기 쉬운 3인 이상 부부·가족 상담에서도 누가
                      말했는지 정확하게 구분합니다.
                      <br />
                      <p className="font-semibold">제출용 품질:</p> 오탈자가
                      거의 없어 슈퍼비전이나 사례 연구 보고서 작성 시 수정
                      시간을 획기적으로 줄여줍니다.
                    </Text>
                    <Text className="text-xs leading-relaxed text-fg-muted">
                      수퍼비전 등 양질의 축어록 작성이 필요할 때 적합합니다.
                    </Text>
                  </div>
                }
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  aria-label="프리미엄 모델 정보"
                  className="ml-1 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-strong text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10C8.55228 10 9 10.4477 9 11C9 11.5523 8.55228 12 8 12ZM9 8.5C9 8.77614 8.77614 9 8.5 9H7.5C7.22386 9 7 8.77614 7 8.5V4.5C7 4.22386 7.22386 4 7.5 4H8.5C8.77614 4 9 4.22386 9 4.5V8.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </Tooltip>
            </div>
            <Text className="text-xs text-fg-muted">
              부부·가족 상담의 화자 분리와
              <br />
              비언어 표현까지 초정밀 기록
            </Text>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Text className="text-sm font-semibold text-fg">분당 1.5</Text>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-fg"
                >
                  <g clipPath="url(#clip0_credit)">
                    <path
                      d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_credit">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  sttModel === 'gemini-3'
                    ? 'border-primary bg-primary'
                    : 'border-border bg-bg'
                }`}
              >
                {sttModel === 'gemini-3' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default SttModelSelector;
