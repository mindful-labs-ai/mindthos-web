import { supabase } from '@/lib/supabase';

export interface Plan {
  id: string;
  type: string;
  description: string;
  price: number;
  total_credit: number;
  is_year: boolean;
}

export const planService = {
  /**
   * 모든 플랜 조회
   */
  async getAllPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('id, type, description, price, total_credit, is_year')
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`플랜 목록 조회 실패: ${error.message}`);
    }

    return data ?? [];
  },

  /**
   * 월간 플랜만 조회
   */
  async getMonthlyPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('id, type, description, price, total_credit, is_year')
      .eq('is_year', false)
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`월간 플랜 조회 실패: ${error.message}`);
    }

    return data ?? [];
  },

  /**
   * 연간 플랜만 조회
   */
  async getYearlyPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('id, type, description, price, total_credit, is_year')
      .eq('is_year', true)
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`연간 플랜 조회 실패: ${error.message}`);
    }

    return data ?? [];
  },

  /**
   * 특정 플랜 조회
   */
  async getPlanById(planId: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .select('id, type, description, price, total_credit, is_year')
      .eq('id', planId)
      .single();

    if (error) {
      throw new Error(`플랜 조회 실패: ${error.message}`);
    }

    return data;
  },
};
