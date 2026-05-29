/**
 * 내담자 채팅 — mindthos-server 채팅 API 클라이언트.
 *
 * 프론트는 서버(`POST /v1/clients/:clientId/chat-messages`)만 호출한다. 서버가
 * 동기로 외부 챗봇 머신을 호출(grounding 구성·LLM)하고, 입력+출력 turn을 저장한 뒤
 * 완료된 메시지(ClientChatMessageDto)를 반환한다. (이전의 챗봇 직접 호출은 폐기)
 */
import { serverRequest } from '@/shared/api/server/serverClient';

/** 서버 ClientChatMessageDto (필요 필드). */
export interface ClientChatMessageDto {
  id: string;
  inputMessage: string;
  outputMessage: string | null;
  processingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  metadata: Record<string, unknown> | null;
}

export interface ChatReply {
  messageId: string;
  message: string;
  processingStatus: string;
}

/** 서버 cursor 페이지네이션 응답 (items는 최신→과거 순). */
interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** 채팅 이력 조회 — GET /clients/:clientId/chat-messages (최신 limit개). */
export async function getChatHistory(
  clientId: string,
  limit = 20,
): Promise<ClientChatMessageDto[]> {
  const page = await serverRequest<CursorPage<ClientChatMessageDto>>(
    `/clients/${clientId}/chat-messages?limit=${limit}`,
  );
  return page.items ?? [];
}

/** 채팅 메시지 전송 (동기 — 서버가 머신 응답까지 받아 완료 turn 반환). */
export async function sendChatMessage(
  clientId: string,
  userMessage: string,
): Promise<ChatReply> {
  const dto = await serverRequest<ClientChatMessageDto>(
    `/clients/${clientId}/chat-messages`,
    { method: 'POST', body: { message: userMessage } },
  );
  return {
    messageId: dto.id,
    message: dto.outputMessage ?? '',
    processingStatus: dto.processingStatus,
  };
}

/**
 * 채팅 메시지 재시도 — 기존 message id로 머신을 다시 호출한다.
 * 서버: POST /clients/:clientId/chat-messages/:messageId/retry.
 * 머신 실패 시 기존 outputMessage 유지하고 502.
 */
export async function retryChatMessage(
  clientId: string,
  messageId: string,
): Promise<ChatReply> {
  const dto = await serverRequest<ClientChatMessageDto>(
    `/clients/${clientId}/chat-messages/${messageId}/retry`,
    { method: 'POST' },
  );
  return {
    messageId: dto.id,
    message: dto.outputMessage ?? '',
    processingStatus: dto.processingStatus,
  };
}
