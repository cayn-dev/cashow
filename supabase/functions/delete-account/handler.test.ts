import { describe, it, expect } from 'bun:test';
import { handleDeletion } from './handler';

const request = (action: string) => new Request('http://localhost/delete', {
  method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify({ action }),
});
describe('delete data and account', () => {
  it('deletes only the authenticated user, never a client supplied identity', async () => {
    const ids: string[] = [];
    const req = new Request('http://localhost/delete', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify({ action: 'account', userId: 'other-user' }) });
    const res = await handleDeletion(req, { authenticate: async () => 'signed-in-user', erase: async (id) => { ids.push(id); }, deleteAccount: async (id) => { ids.push(id); } }, {});
    expect(res.status).toBe(200);
    expect(ids).toEqual(['signed-in-user', 'signed-in-user']);
  });
  it('preserves the login account when deleting all financial data', async () => {
    let deletedAccount = false;
    let scope: boolean | undefined;
    const res = await handleDeletion(request('data'), { authenticate: async () => 'user', erase: async (_id, account) => { scope = account; }, deleteAccount: async () => { deletedAccount = true; } }, {});
    expect(res.status).toBe(200);
    expect(scope).toBe(false);
    expect(deletedAccount).toBe(false);
  });
  it('never deletes the account or reports success if cleanup fails', async () => {
    let deleted = false;
    const res = await handleDeletion(request('account'), { authenticate: async () => 'user', erase: async () => { throw new Error('failed'); }, deleteAccount: async () => { deleted = true; } }, {});
    expect(res.status).toBe(500);
    expect(deleted).toBe(false);
  });
  it('rejects unauthenticated deletion without modifying data', async () => {
    let erased = false;
    const res = await handleDeletion(request('account'), { authenticate: async () => null, erase: async () => { erased = true; }, deleteAccount: async () => {} }, {});
    expect(res.status).toBe(401);
    expect(erased).toBe(false);
  });
});