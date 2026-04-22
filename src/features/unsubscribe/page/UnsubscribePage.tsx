import { useState } from 'react';

import { useSearchParams } from 'react-router-dom';

type ViewState = 'confirm' | 'loading' | 'success' | 'error';

const SUPABASE_URL = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const LOGO_URL =
  'https://api.mindthos.com/storage/v1/object/public/public-img/logo_mindthos_hori.png';
const MINDTHOS_HOME_URL = 'https://mindthos.com/';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [view, setView] = useState<ViewState>(token ? 'confirm' : 'error');
  const [errorMsg, setErrorMsg] = useState(
    token ? '' : '유효하지 않은 수신거부 링크입니다.'
  );

  const handleUnsubscribe = async () => {
    if (!token) return;
    setView('loading');

    try {
      const res = await fetch(
        `https://${SUPABASE_URL}/functions/v1/unsubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );

      const data = (await res.json()) as {
        success: boolean;
        message?: string;
      };

      if (data.success) {
        setView('success');
      } else {
        setErrorMsg(data.message || '처리 중 오류가 발생했습니다.');
        setView('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setView('error');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-10 antialiased"
      style={{ wordBreak: 'keep-all' }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-prominent">
        <div className="flex justify-center px-6 pb-5 pt-10 md:px-10">
          <img
            src={LOGO_URL}
            alt="Mindthos"
            width={140}
            className="block border-0"
          />
        </div>

        <div className="px-6 pb-10 pt-2 text-center md:px-10">
          {view === 'confirm' && (
            <>
              <h1 className="pb-5 text-l font-extrabold leading-[1.4] text-grey-100 md:text-xl">
                마케팅 이메일 수신을 거부하시겠어요?
              </h1>
              <p className="text-grey-100-muted mb-6 text-sm leading-[1.7]">
                선생님께 도움이 될 상담 기록 팁과 혜택 안내를
                <br />더 이상 보내드리지 않을까요?
                <br />
                <br />
                <span className="font-emphasize text-grey-100">
                  서비스 관련 중요 안내는 계속 받으실 수 있습니다.
                </span>
              </p>

              <div className="mb-3 rounded-lg bg-green-50 px-5 py-4 text-center">
                <p className="m-0 text-sm font-emphasize leading-[1.5] text-green-80">
                  💡 마음토스를 더 써보신 적 없다면
                  <br />
                  <span className="font-medium text-grey-100">
                    아래에서 먼저 서비스 소개를 살펴보세요.
                  </span>
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-6">
                <a
                  href={MINDTHOS_HOME_URL}
                  className="inline-block rounded-lg bg-green-80 px-8 py-4 text-m font-headline text-white shadow-default transition-colors"
                >
                  마음토스 홈 둘러보기 👀
                </a>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  className="inline-block rounded-lg border bg-red-20 px-8 py-3 text-sm font-extrabold text-danger transition-colors"
                >
                  수신거부
                </button>
              </div>

              <p className="mt-5 text-xs text-grey-60">
                실수로 클릭하셨다면 이 페이지를 그냥 닫아주세요.
              </p>
            </>
          )}

          {view === 'loading' && (
            <>
              <div className="mb-5 text-5xl" aria-hidden>
                ⏳
              </div>
              <h1 className="mb-3 text-l font-extrabold text-grey-100">
                처리 중...
              </h1>
              <p className="text-sm text-grey-80">잠시만 기다려주세요.</p>
            </>
          )}

          {view === 'success' && (
            <>
              <h1 className="mb-4 text-l font-extrabold leading-[1.4] text-grey-100 md:text-xl">
                수신거부가 완료되었어요
              </h1>
              <p className="mb-6 text-sm leading-[1.7] text-grey-80">
                마음토스 마케팅 이메일 수신이 거부되었습니다.
                <br />
                <span className="font-emphasize text-grey-100">
                  서비스 관련 중요 안내는 계속 받으실 수 있습니다.
                </span>
              </p>
              <a
                href={MINDTHOS_HOME_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-green-80 px-8 py-4 text-m font-headline text-white shadow-default transition-colors"
              >
                마음토스 홈 둘러보기 👀
              </a>
            </>
          )}

          {view === 'error' && (
            <>
              <h1 className="mb-4 text-l font-extrabold leading-[1.4] text-grey-100 md:text-xl">
                요청을 처리하지 못했어요
              </h1>
              <p className="mb-6 text-sm leading-[1.7] text-red-50">
                {errorMsg}
              </p>
              <a
                href={MINDTHOS_HOME_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-green-80 px-8 py-4 text-m font-headline text-white shadow-default transition-colors"
              >
                마음토스 홈 둘러보기 👀
              </a>
            </>
          )}
        </div>

        <div className="border-t border-border-subtle bg-bg-subtle px-8 py-6 text-center">
          <p className="m-0 text-xs font-medium text-grey-60">
            © Mindful Labs Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
