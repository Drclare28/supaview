import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Project, ProjectStore } from '../store/ProjectStore';

export function useSupabase(projectId: string) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initClient() {
      try {
        const projects = await ProjectStore.getProjects();
        const p = projects.find(it => it.id === projectId);
        
        if (!p) {
          setError('Project not found');
          return;
        }

        setProject(p);
        
        // Use service role key if available for administrative tasks, 
        // otherwise fallback to anon key.
        const supabase = createClient(p.url, p.serviceRoleKey || p.anonKey, {
          auth: {
            persistSession: false, // Don't persist session in the app's own storage
          }
        });

        setClient(supabase);
      } catch (e) {
        setError('Failed to initialize Supabase client');
      }
    }

    if (projectId) {
      initClient();
    }
  }, [projectId]);

  return { client, project, error };
}
