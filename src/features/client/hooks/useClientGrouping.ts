import { useMemo } from 'react';

import { compareGroupKeys, getGroupKey } from '@/lib/koreanUtils';

import type { Client } from '../types';

interface ClientGroup {
  key: string;
  clients: Client[];
}

export const useClientGrouping = (clients: Client[]): ClientGroup[] => {
  return useMemo(() => {
    const groups: Record<string, Client[]> = {};

    clients.forEach((client) => {
      const key = getGroupKey(client.name);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(client);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    const sortedKeys = Object.keys(groups).sort(compareGroupKeys);

    return sortedKeys.map((key) => ({
      key,
      clients: groups[key],
    }));
  }, [clients]);
};
