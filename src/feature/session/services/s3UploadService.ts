/**
 * Module 1: AWS S3 Upload Service (Frontend)
 * Presigned URL 방식을 사용하여 보안적으로 S3에 파일 업로드
 *
 * 보안 개선:
 * - AWS 자격 증명은 백엔드에만 존재
 * - 프론트엔드는 제한된 시간의 업로드 권한을 가진 Presigned URL만 사용
 */

import type {
  S3UploadError,
  UploadToS3Request,
  UploadToS3Response,
} from '../types/s3Upload.types';

// Supabase Edge Function URL
const SUPABASE_URL = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

// 지원하는 오디오 파일 형식
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
];
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

// 최대 파일 크기: 2GB (1시간 이상의 오디오 파일 고려)
const MAX_FILE_SIZE_MB = 2048; // 2GB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * 파일 형식 검증
 */
function validateFileType(file: File): boolean {
  const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return (
    SUPPORTED_AUDIO_TYPES.includes(file.type) ||
    (fileExtension !== undefined &&
      SUPPORTED_EXTENSIONS.includes(fileExtension))
  );
}

/**
 * 파일 크기 검증
 */
function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

/**
 * 파일 확장자와 타입을 기반으로 신뢰할 수 있는 Content-Type 결정
 * 브라우저의 file.type이 비어있거나 일관성이 없는 경우를 대비
 */
function determineContentType(file: File): string {
  // 파일 확장자 추출
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  // 확장자 기반 매핑 (우선순위)
  const extensionMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
  };

  if (extension && extensionMap[extension]) {
    return extensionMap[extension];
  }

  // 파일 타입이 있고 지원 목록에 있으면 사용
  if (file.type && SUPPORTED_AUDIO_TYPES.includes(file.type)) {
    return file.type;
  }

  // 기본값
  return 'audio/mpeg';
}

/**
 * 백엔드에서 Presigned URL 요청
 */
async function getPresignedUrl(
  userId: number,
  filename: string,
  contentType: string
): Promise<{
  presigned_url: string;
  s3_key: string;
  public_url: string;
  expires_in: number;
}> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/session/upload-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        filename,
        content_type: contentType,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Presigned URL 생성 실패');
  }

  const data = await response.json();
  return data;
}

/**
 * 오디오 파일의 길이(초) 추출
 */
function extractAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.floor(audio.duration));
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('오디오 메타데이터를 읽을 수 없습니다.'));
    });

    audio.src = objectUrl;
  });
}

/**
 * Presigned URL을 사용하여 S3에 오디오 파일 업로드
 */
export async function uploadAudioToS3(
  request: UploadToS3Request
): Promise<UploadToS3Response> {
  const { file, user_id, onProgress } = request;

  try {
    // 1. 파일 검증
    if (!validateFileType(file)) {
      const error: S3UploadError = {
        code: 'INVALID_FILE_TYPE',
        message:
          '지원하지 않는 파일 형식입니다. MP3, WAV, M4A 파일만 업로드 가능합니다.',
      };
      throw error;
    }

    if (!validateFileSize(file)) {
      const error: S3UploadError = {
        code: 'FILE_TOO_LARGE',
        message: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE_MB}MB까지 업로드 가능합니다.`,
      };
      throw error;
    }

    // 2. 오디오 길이 추출 (비동기로 시도, 실패해도 계속 진행)
    let duration_seconds: number | undefined;
    try {
      duration_seconds = await extractAudioDuration(file);
    } catch {
      // 길이 추출 실패는 치명적이지 않으므로 계속 진행
    }

    if (onProgress) {
      onProgress(10); // Presigned URL 요청 시작
    }

    // 3. Content-Type 결정 (한 번만 결정하여 일관성 유지)
    // 파일 타입이 비어있거나 신뢰할 수 없는 경우를 대비한 매핑
    const contentType = determineContentType(file);

    // 4. 백엔드에서 Presigned URL 받기
    const { presigned_url, s3_key, public_url } = await getPresignedUrl(
      user_id,
      file.name,
      contentType
    );

    if (onProgress) {
      onProgress(20); // Presigned URL 받음, 업로드 시작
    }

    // 5. Presigned URL로 직접 PUT 요청하여 업로드
    // XMLHttpRequest를 사용하여 진행률 추적
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 업로드 진행률 추적
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          // 20% ~ 100% 범위로 매핑
          const percentComplete =
            20 + Math.round((event.loaded / event.total) * 80);
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });

      xhr.open('PUT', presigned_url);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });

    // 5. 결과 반환
    const file_size_mb = parseFloat((file.size / (1024 * 1024)).toFixed(2));

    return {
      success: true,
      audio_url: public_url,
      file_path: s3_key,
      file_size_mb,
      duration_seconds,
    };
  } catch (error) {
    // 에러 처리
    if ((error as S3UploadError).code) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        const networkError: S3UploadError = {
          code: 'NETWORK_ERROR',
          message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        };
        throw networkError;
      }
    }

    const uploadError: S3UploadError = {
      code: 'UPLOAD_FAILED',
      message: '파일 업로드 중 오류가 발생했습니다.',
    };
    throw uploadError;
  }
}

// 서비스 객체로 export
export const s3UploadService = {
  uploadAudio: uploadAudioToS3,
};
