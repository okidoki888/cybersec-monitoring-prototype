/**
 * MITRE ATT&CK API client
 */

const API_BASE = '/api/mitre';

export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  external_id: string;
  platforms: string[];
}

export interface MitreTactic {
  id: string;
  name: string;
  description: string;
  shortname: string;
  techniques: MitreTechnique[];
}

export interface MitreTacticsResponse {
  tactics: MitreTactic[];
}

/**
 * Получает все тактики MITRE ATT&CK с техниками
 */
export async function getMitreTactics(): Promise<MitreTacticsResponse> {
  const response = await fetch(API_BASE + '/tactics');
  if (!response.ok) {
    throw new Error(`Failed to fetch MITRE tactics: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Очищает кэш MITRE данных
 */
export async function clearMitreCache(): Promise<void> {
  const response = await fetch(API_BASE + '/cache/clear', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`Failed to clear cache: ${response.statusText}`);
  }
}
