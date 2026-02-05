 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     console.log('Processing recurring transactions...');
 
     // Call the database function to process recurring transactions
     const { data, error } = await supabase.rpc('process_recurring_transactions');
 
     if (error) {
       console.error('Error processing recurring transactions:', error);
       throw error;
     }
 
     const processedCount = data || 0;
     console.log(`Processed ${processedCount} recurring transactions`);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Processed ${processedCount} recurring transactions`,
         count: processedCount 
       }),
       { 
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200 
       }
     );
   } catch (error) {
     console.error('Edge function error:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ 
         success: false, 
         error: errorMessage 
       }),
       { 
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 500 
       }
     );
   }
 });