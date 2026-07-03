import { createSupabaseClient } from '@/lib/supabase/client';

export class WorkspaceRepository {
  async createWorkspace(input: { name: string; ownerId: string }) {
    const supabase = createSupabaseClient();
    return supabase.from('workspaces').insert({ name: input.name, owner_id: input.ownerId }).select('*').single();
  }

  async getWorkspaceById(id: string) {
    const supabase = createSupabaseClient();
    return supabase.from('workspaces').select('*').eq('id', id).single();
  }
}
