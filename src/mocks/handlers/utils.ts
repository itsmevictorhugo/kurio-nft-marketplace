import { delay, HttpResponse } from 'msw';
import { getSession, guestOwnerKey, userOwnerKey } from '@/mocks/database/mock-database';
import { getMockScenario } from '@/mocks/scenarios';
import type { ApiError } from '@/types/api';

type ErrorCode = ApiError['error']['code'];

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
) {
  return HttpResponse.json<ApiError>({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export async function scenarioResponse(request: Request): Promise<Response | undefined> {
  const scenario = getMockScenario();
  if (scenario === 'latency') {
    await delay(150);
  }
  if (scenario === 'network-error') {
    return HttpResponse.error();
  }
  if (scenario === 'client-error') {
    return apiError(400, 'validation_error', 'Scenario configured a client error.');
  }
  if (scenario === 'server-error') {
    return apiError(500, 'server_error', 'Scenario configured a server error.');
  }
  if (scenario === 'session-expired' && request.headers.has('authorization')) {
    return apiError(401, 'unauthorized', 'Session expired.');
  }

  return undefined;
}

function accessToken(request: Request) {
  const authorization = request.headers.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
}

export function requestUserId(request: Request) {
  return getSession(accessToken(request))?.userId;
}

export function requireUserId(request: Request): string | undefined {
  return requestUserId(request);
}

export function requestOwnerId(request: Request) {
  const userId = requestUserId(request);
  return userId ? userOwnerKey(userId) : guestOwnerKey(request.headers.get('x-guest-id') ?? 'default');
}

export function requestGuestId(request: Request) {
  return request.headers.get('x-guest-id');
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function asPositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
