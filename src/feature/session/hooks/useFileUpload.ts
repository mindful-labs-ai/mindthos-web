// TODO: 삭제 예정 - CreateSessionModal 관련 파일, 사용되지 않음
import type { FileInfo, UploadType } from '../types';

export interface FileUploadResult {
  success: boolean;
  error?: string;
}

export const useFileUpload = (
  type: UploadType,
  onFileSelect: (fileInfo: FileInfo | null) => void
) => {
  const processAudioFile = (file: File): Promise<FileUploadResult> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.src = objectUrl;

      audio.addEventListener('loadedmetadata', () => {
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          duration: Math.floor(audio.duration),
          file,
        };

        onFileSelect(fileInfo);
        URL.revokeObjectURL(objectUrl);
        resolve({ success: true });
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ success: false, error: '오디오 파일을 읽을 수 없습니다.' });
      });
    });
  };

  const processPdfFile = (file: File): FileUploadResult => {
    const fileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      file,
    };

    onFileSelect(fileInfo);
    return { success: true };
  };

  const processFile = async (file: File): Promise<FileUploadResult> => {
    if (type === 'audio') {
      return await processAudioFile(file);
    } else if (type === 'pdf') {
      return processPdfFile(file);
    }
    return { success: false, error: '지원하지 않는 파일 형식입니다.' };
  };

  return { processFile };
};
