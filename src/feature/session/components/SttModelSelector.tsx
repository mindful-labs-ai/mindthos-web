import { Text } from '@/components/ui';

import type { SttModel } from '../types';

interface SttModelSelectorProps {
  sttModel: SttModel;
  setSttModel: React.Dispatch<React.SetStateAction<SttModel>>;
}

const SttModelSelector = ({ sttModel, setSttModel }: SttModelSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSttModel('whisper')}
          className={`flex-1 rounded-lg border-2 p-4 transition-all ${
            sttModel === 'whisper'
              ? 'border-primary bg-primary-50'
              : 'border-border bg-bg hover:border-fg-muted'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 text-left">
              <Text
                className={`mb-1 font-semibold ${
                  sttModel === 'whisper' ? 'text-primary' : 'text-fg'
                }`}
              >
                일반 축어록
              </Text>
              <Text
                className={`text-xs ${
                  sttModel === 'whisper' ? 'text-primary-700' : 'text-fg-muted'
                }`}
              >
                일반 수준 정확도로
                <br />
                축어록을 제작
              </Text>
              <div className="mt-3 flex items-center gap-1">
                <Text
                  className={`text-sm font-semibold ${
                    sttModel === 'whisper' ? 'text-primary' : 'text-fg'
                  }`}
                >
                  분당 1
                </Text>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={
                    sttModel === 'whisper' ? 'text-primary' : 'text-fg'
                  }
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
            </div>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                sttModel === 'whisper'
                  ? 'border-primary bg-primary'
                  : 'border-border bg-bg'
              }`}
            >
              {sttModel === 'whisper' && (
                <svg
                  width="14"
                  height="14"
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
        </button>

        {/* 고급 축어록 (Gemini) */}
        <button
          type="button"
          onClick={() => setSttModel('gemini-3')}
          className={`flex-1 rounded-lg border-2 p-4 transition-all ${
            sttModel === 'gemini-3'
              ? 'border-primary bg-primary-50'
              : 'border-border bg-bg hover:border-fg-muted'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 text-left">
              <Text
                className={`mb-1 font-semibold ${
                  sttModel === 'gemini-3' ? 'text-primary' : 'text-fg'
                }`}
              >
                고급 축어록
              </Text>
              <Text
                className={`text-xs ${
                  sttModel === 'gemini-3' ? 'text-primary-700' : 'text-fg-muted'
                }`}
              >
                감정 반응을 포함한 높은
                <br />
                정확도로 축어록을 제작
              </Text>
              <div className="mt-3 flex items-center gap-1">
                <Text
                  className={`text-sm font-semibold ${
                    sttModel === 'gemini-3' ? 'text-primary' : 'text-fg'
                  }`}
                >
                  분당 1.5
                </Text>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={
                    sttModel === 'gemini-3' ? 'text-primary' : 'text-fg'
                  }
                >
                  <g clipPath="url(#clip0_credit2)">
                    <path
                      d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_credit2">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                sttModel === 'gemini-3'
                  ? 'border-primary bg-primary'
                  : 'border-border bg-bg'
              }`}
            >
              {sttModel === 'gemini-3' && (
                <svg
                  width="14"
                  height="14"
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
        </button>
      </div>
    </div>
  );
};

export default SttModelSelector;
