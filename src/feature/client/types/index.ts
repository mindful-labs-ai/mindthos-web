export interface Client {
  id: string;
  counselor_id: string;
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
}

export interface CreateClientRequest {
  name: string;
  phone_number: string;
  memo?: string;
  pin?: boolean;
}

export interface UpdateClientRequest {
  name?: string;
  phone_number?: string;
  memo?: string;
  pin?: boolean;
}
