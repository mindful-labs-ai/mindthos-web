import { useEffect, useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { CREDIT_COST } from '@/shared/constants/credit';
import { useDevice } from '@/shared/hooks/useDevice';
import {
  AnalysisChatSendIcon,
  CreditIcon,
  SecurityShieldIcon,
} from '@/shared/icons';

interface AnalysisChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** 우측 크레딧 사용 칩 cost (showCreditChip이 true일 때 표시) */
  creditCost?: number;
  /** 크레딧 사용 칩 노출 여부 (조건은 추후 외부에서 명시) */
  showCreditChip?: boolean;
  className?: string;
}

const MAX_CHAT_INPUT_LENGTH = 500;
const CHAT_INPUT_LINE_HEIGHT = 24;
const CHAT_INPUT_MAX_LINES = 3;

export const AnalysisChatInput = ({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = '심리검사 결과지를 등록한 뒤 분석을 시작해 주세요.',
  creditCost = CREDIT_COST.PSYCH_CHAT,
  showCreditChip = true,
  className,
}: AnalysisChatInputProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const normalizedValue = value.slice(0, MAX_CHAT_INPUT_LENGTH);
  const characterCount = normalizedValue.length;
  const verticalPaddingTop = isMobileView ? 10 : 14;
  // 하단 패딩 30(모바일 22 → 30): 최소 높이 +8px 확보 + 우측 하단 글자수 카운터가
  // 전송 버튼과 겹치지 않도록 충분한 하단 공간 확보(데스크탑과 동일).
  const verticalPaddingBottom = 30;
  const horizontalPaddingRight = isMobileView ? 12 : 14;
  const horizontalPaddingLeft = isMobileView ? 16 : 24;
  const sendButtonSize = isMobileView ? 36 : 32;
  const textareaMaxHeight = CHAT_INPUT_LINE_HEIGHT * CHAT_INPUT_MAX_LINES;
  const placeholderFontSize = isMobileView ? 14 : 16;
  const inputMaxHeight =
    verticalPaddingTop +
    Math.max(textareaMaxHeight, sendButtonSize) +
    verticalPaddingBottom;
  const isSendDisabled = disabled || normalizedValue.trim().length === 0;

  // mirror로 한 줄 텍스트 폭 측정 → textarea의 width/height를 한 effect에서 atomic 갱신.
  // value 없음: textarea가 mirror 폭(칩이 placeholder 옆에 붙음)
  // value 있음: width 비워서 flex-1로 가용공간 차지
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value.length > MAX_CHAT_INPUT_LENGTH) {
      onChange(normalizedValue);
    }
  }, [normalizedValue, onChange, value.length]);

  // 외부에서 value를 빈 값 → 비어있지 않은 값으로 채워주면(예: 환영 화면 추천 칩 클릭)
  // 자동으로 포커스 + 커서를 끝으로 이동시켜 사용자가 엔터만 눌러 전송 가능.
  // 사용자가 직접 타이핑하는 경우엔 이미 focus 상태라 .focus()가 no-op.
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current === '' && normalizedValue.length > 0) {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
      }
    }
    prevValueRef.current = normalizedValue;
  }, [normalizedValue]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    const update = () => {
      // 1) width — value 유무에 따라 직접 적용
      if (normalizedValue) {
        textarea.style.width = '';
      } else {
        textarea.style.width = `${mirror.offsetWidth + 2}px`;
      }

      // 2) height — 1줄 최소, 3줄 최대, 초과 시 스크롤
      const minLines = 1;
      textarea.style.height = 'auto';
      const rawLines = Math.ceil(
        textarea.scrollHeight / CHAT_INPUT_LINE_HEIGHT
      );
      const lines = Math.max(
        minLines,
        Math.min(rawLines, CHAT_INPUT_MAX_LINES)
      );
      textarea.style.height = `${lines * CHAT_INPUT_LINE_HEIGHT}px`;
      textarea.style.overflowY =
        rawLines > CHAT_INPUT_MAX_LINES ? 'auto' : 'hidden';
    };

    update();

    // 폰트 로딩 후 한 번 더 measure — 폰트가 늦게 로드되어 fallback 폰트로
    // 첫 measure가 잘못 잡히는 확률적 깨짐 방지
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled && textareaRef.current && mirrorRef.current) {
          update();
        }
      });
    }

    // 가용 폭이 변하면 줄바꿈 결과도 달라지므로 resize 시 재측정
    const handleResize = () => update();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [normalizedValue, placeholder]);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col gap-2 rounded-2xl border border-grey-40 bg-grey-20',
        className
      )}
      style={{
        maxHeight: inputMaxHeight,
        paddingTop: verticalPaddingTop,
        paddingRight: horizontalPaddingRight,
        paddingBottom: verticalPaddingBottom,
        paddingLeft: horizontalPaddingLeft,
      }}
    >
      <div className="relative flex items-center gap-2">
        {!value && (
          <SecurityShieldIcon
            size={20}
            className="flex-shrink-0 text-grey-70"
          />
        )}

        {/* invisible mirror — textarea와 동일 폰트/사이즈로 한 줄 너비 측정 */}
        <span
          ref={mirrorRef}
          aria-hidden
          className="invisible absolute left-0 top-0 whitespace-pre"
          style={{
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            letterSpacing: 'inherit',
            fontSize: normalizedValue ? 16 : placeholderFontSize,
            lineHeight: `${CHAT_INPUT_LINE_HEIGHT}px`,
          }}
        >
          {normalizedValue || placeholder}
        </span>

        <textarea
          ref={textareaRef}
          value={normalizedValue}
          onChange={(e) =>
            onChange(e.target.value.slice(0, MAX_CHAT_INPUT_LENGTH))
          }
          onKeyDown={(e) => {
            // Enter = 전송, Shift+Enter = 줄바꿈.
            // 단, 한글 등 IME 조합 중의 Enter는 "조합 확정"이므로 전송하지 않는다
            // (가드 없으면 중복 제출 + 마지막 조합 글자만 전송되는 버그).
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={MAX_CHAT_INPUT_LENGTH}
          rows={1}
          className={cn(
            'min-w-0 resize-none overflow-y-auto bg-transparent placeholder:text-grey-70 focus:outline-none disabled:cursor-not-allowed',
            normalizedValue ? 'flex-1 text-grey-100' : 'text-grey-70'
          )}
          style={{
            // width/height는 useLayoutEffect에서 직접 관리 (React style에서 제외)
            // textarea는 UA 기본 font-family가 monospace인 경우가 있어 inherit로 강제
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            letterSpacing: 'inherit',
            fontSize: normalizedValue ? 16 : placeholderFontSize,
            lineHeight: `${CHAT_INPUT_LINE_HEIGHT}px`,
            maxHeight: textareaMaxHeight,
            padding: 0,
            border: 0,
            boxSizing: 'border-box',
          }}
        />

        {showCreditChip && !normalizedValue && (
          <span className="inline-flex flex-shrink-0 items-center justify-center gap-1 rounded-md bg-grey-40 px-1 py-0.5 text-sm text-grey-80">
            <span>{creditCost}</span>
            <CreditIcon size={12} color="currentColor" />
            {!isMobileView && <span>사용</span>}
          </span>
        )}

        {/* spacer — value 없을 때만 (value 있으면 textarea가 flex-1로 가용공간 차지) */}
        {!normalizedValue && <div className="flex-1" />}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSendDisabled}
          className={cn(
            'flex flex-shrink-0 items-center justify-center self-start rounded-xl border border-grey-40 bg-white text-grey-80 transition-colors disabled:cursor-not-allowed disabled:border-grey-40 disabled:bg-grey-40 disabled:text-grey-20',
            !isSendDisabled && 'lg:hover:bg-grey-10'
          )}
          style={{
            width: sendButtonSize,
            height: sendButtonSize,
          }}
          aria-label="전송"
        >
          <AnalysisChatSendIcon size={20} />
        </button>
      </div>

      <span
        className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-grey-60"
        aria-label={`입력 글자 수 ${characterCount}/${MAX_CHAT_INPUT_LENGTH}`}
      >
        {characterCount}/{MAX_CHAT_INPUT_LENGTH}
      </span>
    </div>
  );
};
