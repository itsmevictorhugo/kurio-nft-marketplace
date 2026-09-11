import { HttpResponse, http } from 'msw';
import { domainHandlers } from '@/mocks/handlers/domain-handlers';
import { getMockDatabase, persistMockDatabase } from '@/mocks/database/mock-database';
import { resetMockState } from '@/mocks/reset';
import { selectMockScenario, type MockScenarioName } from '@/mocks/scenarios';
import {
  broadcastNftUpdated,
  broadcastOrderUpdated,
  closeAllRealtimeConnections,
  createRealtimeEnvelope,
  realtimeConnectionCount,
  realtimeServerHandlers,
} from '@/mocks/socket/hub';
import type { NftUpdatedPayload, OrderUpdatedPayload, RealtimeEnvelope } from '@/types/realtime';

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...realtimeServerHandlers,
  ...domainHandlers,
  // Mock-only control endpoints used by development tooling and Playwright
  // to start each scenario from isolated, deterministic state. They belong to
  // the mock layer only and are never referenced by application code.
  http.post('/api/__mock/reset', () => {
    resetMockState();
    return HttpResponse.json({ ok: true });
  }),
  http.post('/api/__mock/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario?: MockScenarioName };
    if (body.scenario) {
      selectMockScenario(body.scenario);
      persistMockDatabase();
      // Price/availability scenarios mutate the shared database; the change is
      // published over the Socket.IO transport so connected clients receive
      // `nft.updated` with the persisted NFT and version (REST and realtime
      // stay aligned — see README §6).
      if (body.scenario === 'price-changed' || body.scenario === 'sold-out') {
        const nft = getMockDatabase().nfts.find((item) => item.id === 'nft-aurora');
        if (nft) {
          broadcastNftUpdated(createRealtimeEnvelope(nft.id, nft.version, { nft }));
        }
      }
      return HttpResponse.json({ ok: true });
    }
    return HttpResponse.json({ ok: false }, { status: 400 });
  }),
  http.post('/api/__mock/socket/emit', async ({ request }) => {
    const body = (await request.json()) as {
      event: 'nft.updated' | 'order.updated';
      envelope: RealtimeEnvelope<unknown>;
    };
    if (body.event === 'nft.updated') {
      broadcastNftUpdated(body.envelope as RealtimeEnvelope<NftUpdatedPayload>);
      return HttpResponse.json({ ok: true });
    }
    if (body.event === 'order.updated') {
      const payload = body.envelope.payload as OrderUpdatedPayload;
      broadcastOrderUpdated(payload.order.ownerId, body.envelope as RealtimeEnvelope<OrderUpdatedPayload>);
      return HttpResponse.json({ ok: true });
    }
    return HttpResponse.json({ ok: false }, { status: 400 });
  }),
  http.post('/api/__mock/socket/disconnect', () => {
    closeAllRealtimeConnections();
    return HttpResponse.json({ ok: true });
  }),
  http.get('/api/__mock/socket/connections', () =>
    HttpResponse.json({ connections: realtimeConnectionCount() }),
  ),
];