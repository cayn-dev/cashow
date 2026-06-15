import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create client with user's token to get user ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to delete all user data and then the auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Delete user data. Most tables use user_id; some use a different column.
    const tablesByUserId = [
      'audit_log',
      'bank_accounts',
      'csv_imports',
      'push_subscriptions',
      'transactions',
      'recurring_transactions',
      'savings_goals',
      'expense_splits',
      'group_members',
      'profiles',
      'user_roles',
    ]

    for (const table of tablesByUserId) {
      const { error } = await adminClient.from(table).delete().eq('user_id', user.id)
      if (error) {
        console.error(`Error deleting from ${table}:`, error)
      }
    }

    // group_invites uses created_by
    {
      const { error } = await adminClient.from('group_invites').delete().eq('created_by', user.id)
      if (error) console.error('Error deleting from group_invites:', error)
    }

    // shared_groups uses owner_id (cascades to remaining group_members/expenses via cleanup trigger)
    {
      const { error } = await adminClient.from('shared_groups').delete().eq('owner_id', user.id)
      if (error) console.error('Error deleting from shared_groups:', error)
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
