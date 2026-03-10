import { useMemo } from 'react';

import { calculateSearchScore, matchesInitialSearch } from '@/lib/searchUtils';

import type { Client } from '../types';

interface SearchResult {
  client: Client;
  score: number;
}

export const useClientSearch = (clients: Client[], searchQuery: string) => {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }

    const query = searchQuery.trim();

    const matched: SearchResult[] = clients
      .filter(
        (client) =>
          matchesInitialSearch(client.name, query) ||
          client.phone_number?.includes(query)
      )
      .map((client) => {
        const nameScore = calculateSearchScore(client.name, query);
        const phoneScore = client.phone_number?.includes(query) ? 10 : 0;

        return {
          client,
          score: nameScore + phoneScore,
        };
      });

    matched.sort((a, b) => b.score - a.score);

    return matched.map((item) => item.client);
  }, [clients, searchQuery]);
};
