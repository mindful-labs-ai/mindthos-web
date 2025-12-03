import { useEffect, useState } from 'react';

interface UseAudioPreloadReturn {
  blobUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 오디오 파일을 미리 Blob으로 다운로드하여 로컬 URL을 반환
 * 이를 통해 시간 이동 시 네트워크 요청 없이 즉시 재생 가능
 */
export const useAudioPreload = (
  audioUrl: string | null
): UseAudioPreloadReturn => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!audioUrl) {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }

        const blob = await response.blob();

        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (cancelled) return;

        const error =
          err instanceof Error ? err : new Error('Failed to load audio');
        setError(error);
        console.error('[useAudioPreload] Error loading audio:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioUrl]);

  return { blobUrl, isLoading, error };
};
