/**
 * Module 1: AWS S3 Upload Service (Frontend)
 * Presigned URL 방식을 사용하여 보안적으로 S3에 파일 업로드
 *
 * 보안 개선:
 * - AWS 자격 증명은 백엔드에만 존재
 * - 프론트엔드는 제한된 시간의 업로드 권한을 가진 Presigned URL만 사용
 */

import { sttBackend } from '@/shared/api/adapters/stt';
import { FILE_UPLOAD_LIMITS } from '@/shared/constants/fileUpload';

import { S3UploadError } from '../types/s3Upload.types';
import type {
  UploadToS3Request,
  UploadToS3Response,
} from '../types/s3Upload.types';

// 지원하는 오디오 파일 형식
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
];
const SUPPORTED_EXTENSIONS = FILE_UPLOAD_LIMITS.AUDIO.FORMATS.map((ext) =>
  ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
);

// 최대 파일 크기 (constants/fileUpload.ts의 설정을 따름)
const MAX_FILE_SIZE_MB = FILE_UPLOAD_LIMITS.AUDIO.MAX_SIZE_MB;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// S3 PUT 재시도 — 일시적 실패(네트워크 단절·5xx·429)만 대상. presigned URL은
// 15분 유효하므로 수 초 간격 재시도에는 재발급이 필요 없다.
const S3_PUT_MAX_ATTEMPTS = 3;
const S3_PUT_RETRY_BASE_DELAY_MS = 1000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

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
 * 백엔드에서 Presigned URL 요청 — STT 백엔드 포트로 위임.
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
  return sttBackend.getUploadUrl(userId, filename, contentType);
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
      reject(new Error('오디오 메타데이터를 읽을 수 없어요.'));
    });

    audio.src = objectUrl;
  });
}

/** HTTP 상태 기준 재시도 가능 여부 — 4xx는 같은 URL로 재시도해도 결과가 같다. */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Presigned URL로 S3에 단일 PUT 시도.
 * XMLHttpRequest를 사용하여 진행률 추적. 실패는 항상 S3UploadError로 reject.
 */
function putFileToS3(params: {
  presignedUrl: string;
  file: File;
  contentType: string;
  onProgress?: (progress: number) => void;
}): Promise<void> {
  const { presignedUrl, file, contentType, onProgress } = params;

  return new Promise<void>((resolve, reject) => {
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
        reject(
          new S3UploadError(
            'UPLOAD_FAILED',
            `업로드 실패: ${xhr.status} ${xhr.statusText}`,
            isRetryableStatus(xhr.status)
          )
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(
        new S3UploadError(
          'NETWORK_ERROR',
          '네트워크 오류가 생겼어요. 인터넷 연결을 확인해 주세요.',
          true
        )
      );
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

/** 일시적 실패(retryable)에 한해 지수적 지연을 두고 S3 PUT을 재시도한다. */
async function putFileToS3WithRetry(
  params: Parameters<typeof putFileToS3>[0]
): Promise<void> {
  for (let attempt = 1; attempt <= S3_PUT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await putFileToS3(params);
      return;
    } catch (error) {
      const failure = error as S3UploadError;
      if (!failure.retryable || attempt === S3_PUT_MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(S3_PUT_RETRY_BASE_DELAY_MS * attempt);
    }
  }
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
      throw new S3UploadError(
        'INVALID_FILE_TYPE',
        '지원하지 않는 파일 형식입니다. MP3, WAV, M4A 파일만 업로드 가능해요.'
      );
    }

    if (!validateFileSize(file)) {
      throw new S3UploadError(
        'FILE_TOO_LARGE',
        `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE_MB}MB까지 업로드 가능해요.`
      );
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

    // 5. Presigned URL로 직접 PUT 요청하여 업로드 (일시적 실패는 재시도)
    await putFileToS3WithRetry({
      presignedUrl: presigned_url,
      file,
      contentType,
      onProgress,
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
    if (error instanceof S3UploadError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        throw new S3UploadError(
          'NETWORK_ERROR',
          '네트워크 오류가 생겼어요. 인터넷 연결을 확인해 주세요.'
        );
      }
    }

    // presigned URL 발급 실패 등 — 서버가 준 메시지('로그인이 필요합니다.' 등)를
    // 유실하지 않고 그대로 전달한다.
    const originalMessage =
      error instanceof Error && error.message ? error.message : undefined;
    throw new S3UploadError(
      'UPLOAD_FAILED',
      originalMessage || '파일 업로드 중 오류가 생겼어요.'
    );
  }
}

// 서비스 객체로 export
export const s3UploadService = {
  uploadAudio: uploadAudioToS3,
};
