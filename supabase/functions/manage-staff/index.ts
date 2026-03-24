import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type StaffRole = 'admin' | 'cashier' | 'kitchen' | 'waiter';

type RequestBody =
  | {
      action: 'create';
      email: string;
      password: string;
      fullName: string;
      role: StaffRole;
    }
  | {
      action: 'update-role';
      staffId: string;
      role: StaffRole;
    };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = request.headers.get('Authorization') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: authUser, error: authUserError } = await userClient.auth.getUser();
    if (authUserError || !authUser.user) {
      throw new Error('Authentication required.');
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', authUser.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Only admins can manage staff accounts.');
    }

    const body = (await request.json()) as RequestBody;

    if (body.action === 'create') {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.fullName,
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? 'Unable to create staff user.');
      }

      const { data: createdProfile, error: createdProfileError } = await adminClient
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: body.email,
          full_name: body.fullName,
          role: body.role,
        })
        .select('*')
        .single();

      if (createdProfileError) {
        throw new Error(createdProfileError.message);
      }

      return Response.json(createdProfile, { headers: corsHeaders });
    }

    const { data: updatedProfile, error: updatedProfileError } = await adminClient
      .from('profiles')
      .update({ role: body.role })
      .eq('id', body.staffId)
      .select('*')
      .single();

    if (updatedProfileError) {
      throw new Error(updatedProfileError.message);
    }

    return Response.json(updatedProfile, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error.',
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
});
