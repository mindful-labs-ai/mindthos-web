/**
 * 디바운스: 연속된 호출을 지연시키고 마지막 호출만 실행
 * @param func 실행할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 쓰로틀링: 일정 시간 동안 최대 한 번만 실행
 * @param func 실행할 함수
 * @param delay 쓰로틀 시간 (ms)
 * @returns 쓰로틀된 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecutedTime = 0;

  return function (this: unknown, ...args: Parameters<T>) {
    const currentTime = Date.now();

    if (currentTime - lastExecutedTime >= delay) {
      func.apply(this, args);
      lastExecutedTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(
        () => {
          func.apply(this, args);
          lastExecutedTime = Date.now();
          timeoutId = null;
        },
        delay - (currentTime - lastExecutedTime)
      );
    }
  };
}

/**
 * Promise 기반 디바운스: 비동기 함수를 디바운스
 * @param func 실행할 비동기 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 비동기 함수
 */
export function debounceAsync<
  T extends (...args: unknown[]) => Promise<unknown>,
>(func: T, delay: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return function (
    this: unknown,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          func
            .apply(this, args)
            .then(resolve as (value: unknown) => void)
            .catch(reject)
            .finally(() => {
              timeoutId = null;
              pendingPromise = null;
            });
        }, delay);
      }) as Promise<ReturnType<T>>;
    }

    return pendingPromise;
  };
}

/**
 * Promise 기반 쓰로틀링: 비동기 함수를 쓰로틀
 * @param func 실행할 비동기 함수
 * @param delay 쓰로틀 시간 (ms)
 * @returns 쓰로틀된 비동기 함수
 */
export function throttleAsync<
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> | undefined {
  let isThrottled = false;
  let lastArgs: Parameters<T> | null = null;

  return function (
    this: unknown,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> | undefined {
    if (!isThrottled) {
      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
        if (lastArgs) {
          const argsToExecute = lastArgs;
          lastArgs = null;
          func.apply(this, argsToExecute);
        }
      }, delay);

      return func.apply(this, args) as Promise<ReturnType<T>>;
    } else {
      lastArgs = args;
      return undefined;
    }
  };
}
