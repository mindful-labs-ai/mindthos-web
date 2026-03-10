import { supabase } from '@/lib/supabase';

export interface SubscriptionInfo {
  plan: {
    id: string;
    type: string;
    description: string;
    total_credit: number;
  };
  subscription: {
    start_at: string | null;
    end_at: string | null;
    reset_at: string | null;
    scheduled_plan_id: string | null;
  };
}

export interface CreditUsage {
  total_usage: number;
}

export interface CreditLog {
  id: string;
  user_id: number;
  use_type: string;
  use_amount: number;
  log_memo: string | null;
  created_at: string;
  feature_metadata: Record<string, unknown> | null;
}

export interface CreditInfo {
  plan: {
    total: number;
    used: number;
    remaining: number;
    type: string;
    description: string;
  };
  subscription: {
    start_at: string | null;
    end_at: string | null;
    reset_at: string | null;
    scheduled_plan_id: string | null;
  };
}

export const creditService = {
  async getSubscriptionInfo(userId: number): Promise<SubscriptionInfo> {
    const { data: subscribeData, error: subscribeError } = await supabase
      .from('subscribe')
      .select('plan_id, start_at, end_at, scheduled_plan_id')
      .eq('user_id', userId)
      .order('start_at', { ascending: false })
      .limit(1)
      .single();

    if (subscribeError) {
      throw new Error(`구독 정보 조회 실패: ${subscribeError.message}`);
    }

    if (!subscribeData) {
      throw new Error('구독 정보가 없습니다.');
    }

    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('id, type, description, total_credit')
      .eq('id', subscribeData.plan_id)
      .single();

    if (planError) {
      throw new Error(`플랜 정보 조회 실패: ${planError.message}`);
    }

    if (!planData) {
      throw new Error('플랜 정보가 없습니다.');
    }

    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('reset_at')
      .eq('user_id', userId)
      .eq('plan_id', subscribeData.plan_id)
      .single();

    if (usageError) {
      throw new Error(`사용량 정보 조회 실패: ${usageError.message}`);
    }

    return {
      plan: {
        id: planData.id,
        type: planData.type,
        description: planData.description,
        total_credit: planData.total_credit,
      },
      subscription: {
        start_at: subscribeData.start_at,
        end_at: subscribeData.end_at,
        reset_at: usageData?.reset_at ?? null,
        scheduled_plan_id: subscribeData.scheduled_plan_id,
      },
    };
  },

  async getCreditUsage(userId: number): Promise<CreditUsage> {
    const { data, error } = await supabase
      .from('usage')
      .select('total_usage')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`사용량 정보 조회 실패: ${error.message}`);
    }

    if (!data) {
      throw new Error('사용량 정보가 없습니다.');
    }

    return {
      total_usage: data.total_usage ?? 0,
    };
  },

  async getCreditLogs(
    userId: number,
    page: number = 0,
    pageSize: number = 20
  ): Promise<CreditLog[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('credit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`크레딧 로그 조회 실패: ${error.message}`);
    }

    return data || [];
  },
};
