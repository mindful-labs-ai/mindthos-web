import { supabase } from '@/lib/supabase';

export const genogramService = {
  async getByClientId(clientId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('genograms')
      .select('data')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) throw error;
    return data ? JSON.stringify(data.data) : null;
  },

  async save(
    clientId: string,
    userId: string,
    jsonData: string
  ): Promise<void> {
    const { error } = await supabase.from('genograms').upsert(
      {
        client_id: clientId,
        user_id: userId,
        data: JSON.parse(jsonData),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' }
    );

    if (error) throw error;
  },
};
