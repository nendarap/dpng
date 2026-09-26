export interface GroundingMapsChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: Array<{
        snippet?: string;
        sourceUri?: string;
      }>;
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface MapsGroundingResult {
  text: string;
  groundingChunks: GroundingMapsChunk[];
}

export async function queryMapsGrounding(
  prompt: string,
  location?: { latitude: number; longitude: number }
): Promise<MapsGroundingResult> {
  const response = await fetch('/api/gemini/maps-grounding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Terjadi kesalahan saat menghubungi layanan Google Maps Grounding (${response.status})`
    );
  }

  const data: MapsGroundingResult = await response.json();
  return data;
}
