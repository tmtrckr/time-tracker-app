import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import { api } from '../services/api';

export const useProjects = (includeArchived = false) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.projects.getProjects(includeArchived);
      // Ensure we always have an array, even if empty
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      // Set empty array on error so UI can still function
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'is_archived'>) => {
    const newProject = await api.projects.createProject(project);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (project: Project) => {
    const updated = await api.projects.updateProject(project);
    // Update the project in the list with the returned updated project
    // This ensures we have the correct is_archived value from the server
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p => p.id === project.id ? updated : p);
      return updatedProjects;
    });
    return updated;
  };

  const deleteProject = async (id: number) => {
    await api.projects.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
