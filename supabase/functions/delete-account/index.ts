import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { handleDeletion } from './handler.ts';

Deno.serve((req) => handleDeletion(req, {
  authenticate: async (authorization) => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) throw new Error('Missing configuration');
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data, error } = await client.auth.getUser();
    return error ? null : data.user?.id ?? null;
  },
  erase: async (userId, deleteAccount) => {
    const client = adminClient();
    const { error } = await client.rpc('erase_user_financial_data', { _user_id: userId, _delete_account: deleteAccount });
    if (error) throw error;
  },
  deleteAccount: async (userId) => {
    const { error } = await adminClient().auth.admin.deleteUser(userId);
    if (error) throw error;
  },
}, corsHeaders));

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing configuration');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
