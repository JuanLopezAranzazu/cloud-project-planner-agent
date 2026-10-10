import type { Plan, PlanRequest } from './types';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createPlan(req: PlanRequest, signal?: AbortSignal): Promise<Plan> {
  let res: Response;
  try {
    res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError('network', 'I couldn\'t reach the server. Check your connection and try again.');
  }

  if (res.status === 504) {
    throw new ApiError('timeout', 'Nimbo took too long thinking. Try a shorter or more specific idea.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      data?.error?.code ?? 'unknown',
      data?.error?.message ?? 'Something went wrong on our side. Please try again in a moment.',
    );
  }
  return data.plan as Plan;
}
