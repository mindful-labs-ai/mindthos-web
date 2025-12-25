export interface CreateClientRequest {
  counselor_email: string;
  name: string;
  phone_number?: string;
  email?: string;
  counsel_theme?: string;
  memo?: string;
  counsel_number?: number;
}

export interface CreateClientResponse {
  success: boolean;
  message?: string;
  client?: {
    id: string;
    name: string;
  };
}

export interface ClientApiError {
  status: number;
  success: false;
  error: string;
  message: string;
}

export type ClientErrorCode =
  | 'EMAIL_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'TOO_MANY_CLIENTS'
  | 'COUNSELOR_NOT_FOUND'
  | 'CLIENT_CREATION_FAILED'
  | 'VALIDATION_ERROR';

export interface GetClientsRequest {
  counselor_id: string;
}

export interface GetClientsResponse {
  success: boolean;
  message?: string;
  clients: Array<{
    id: string;
    name: string;
    phone_number: string;
    email: string | null;
    counsel_theme: string | null;
    counsel_number: number;
    counsel_done: boolean;
    memo: string | null;
    pin: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

export interface UpdateClientRequest {
  client_id: string;
  name?: string;
  phone_number?: string;
  email?: string;
  counsel_theme?: string;
  memo?: string;
  counsel_number?: number;
  counsel_done?: boolean;
  pin?: boolean;
}

export interface UpdateClientResponse {
  success: boolean;
  message?: string;
}

export interface DeleteClientRequest {
  client_id: string;
}

export interface DeleteClientResponse {
  success: boolean;
  message?: string;
}
