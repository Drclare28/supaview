import * as SecureStore from 'expo-secure-store';

const PROJECTS_KEY = 'supaview_projects';

export interface Project {
  id: string;
  name: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export const ProjectStore = {
  async getProjects(): Promise<Project[]> {
    try {
      const projectsJson = await SecureStore.getItemAsync(PROJECTS_KEY);
      return projectsJson ? JSON.parse(projectsJson) : [];
    } catch (e) {
      console.error('Failed to load projects', e);
      return [];
    }
  },

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    const newProjects = [...projects, project];
    await SecureStore.setItemAsync(PROJECTS_KEY, JSON.stringify(newProjects));
  },

  async removeProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const newProjects = projects.filter(p => p.id !== id);
    await SecureStore.setItemAsync(PROJECTS_KEY, JSON.stringify(newProjects));
  }
};
