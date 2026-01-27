import React, { useState } from 'react';
import { Project } from '../../types';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import Toggle from '../Common/Toggle';
import ProjectForm from './ProjectForm';
import { Edit2, Archive, RotateCcw, Trash2 } from 'lucide-react';

const Projects: React.FC = () => {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { projects, loading, error, refetch, createProject, updateProject, deleteProject } = useProjects(includeArchived);

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      setIsSubmitting(true);
      await createProject(projectData as Omit<Project, 'id' | 'created_at' | 'is_archived'>);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Project created successfully');
      setShowNewForm(false);
      // Refresh the list to ensure consistency and clear any previous errors
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!editingProjectId) return;
    
    try {
      setIsSubmitting(true);
      const project = projects.find(p => p.id === editingProjectId);
      if (!project) return;

      // Prevent editing archived projects
      if (project.is_archived) {
        const { showError } = await import('../../utils/toast');
        showError('Cannot edit archived projects. Please restore the project first.');
        setEditingProjectId(null);
        return;
      }

      await updateProject({
        ...project,
        ...projectData,
      } as Project);
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Project updated successfully');
      setEditingProjectId(null);
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveProject = async (id: number, archive: boolean) => {
    try {
      const project = projects.find(p => p.id === id);
      if (!project) return;

      // If archiving a project that's being edited, cancel editing
      if (archive && editingProjectId === id) {
        setEditingProjectId(null);
      }

      await updateProject({
        ...project,
        is_archived: archive,
      });
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess(archive ? 'Project archived' : 'Project restored');
      // Refresh the list to update the project's position
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, `Failed to ${archive ? 'archive' : 'restore'} project`);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(id);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Project deleted successfully');
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to delete project');
    }
  };

  // Filter projects: ensure we correctly identify archived vs active
  // When includeArchived is false, API only returns active projects (filtered in SQL)
  // When includeArchived is true, API returns all projects, so we filter them here
  
  const activeProjects = includeArchived 
    ? projects.filter(p => {
        // Explicitly check: only boolean true means archived, everything else is active
        // Use strict equality to ensure we catch boolean true, not string "true" or number 1
        const isArchived = p.is_archived === true;
        return !isArchived;
      })
    : projects; // When includeArchived is false, all returned projects are active (SQL filtered)
  
  const archivedProjects = includeArchived 
    ? projects.filter(p => {
        // Only include projects explicitly marked as archived (strictly boolean true)
        const isArchived = p.is_archived === true;
        return isArchived;
      })
    : []; // When includeArchived is false, no archived projects are loaded

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Warning */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Warning: {error}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              You can still create new projects.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="ml-4"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your projects and track billable hours
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle
            checked={includeArchived}
            onChange={setIncludeArchived}
            label="Show archived"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowNewForm(true);
              setEditingProjectId(null);
            }}
            disabled={showNewForm}
          >
            + New Project
          </Button>
        </div>
      </div>

      {/* New Project Form */}
      {showNewForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 shadow-sm border-2 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Project
          </h2>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowNewForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Active Projects */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Projects ({activeProjects.length})
        </h2>
        
        {activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-600 dark:text-gray-400">
              No active projects. Create your first project to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project) => (
              <div key={project.id}>
                {editingProjectId === project.id ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      Edit Project
                    </h3>
                    <ProjectForm
                      project={project}
                      onSubmit={handleUpdateProject}
                      onCancel={() => setEditingProjectId(null)}
                      onDelete={async (id) => {
                        await handleDeleteProject(id);
                        setEditingProjectId(null);
                      }}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {/* Color Indicator */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-sm"
                      style={{ backgroundColor: project.color || '#888888' }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        {project.is_billable && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            Billable
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {project.client_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Client: {project.client_name}
                          </p>
                        )}
                        {project.is_billable && project.hourly_rate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${project.hourly_rate.toFixed(2)}/hr
                          </p>
                        )}
                        {project.budget_hours && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Budget: {project.budget_hours.toFixed(1)}h
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingProjectId(project.id)}
                        title="Edit project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleArchiveProject(project.id, true)}
                        title="Archive project"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Projects */}
      {includeArchived && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Archived Projects ({archivedProjects.length})
          </h2>
          
          {archivedProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-600 dark:text-gray-400">
                No archived projects.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Color Indicator */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-sm"
                    style={{ backgroundColor: project.color || '#888888' }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-600 dark:text-gray-400 line-through">
                        {project.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        Archived
                      </span>
                    </div>
                    {project.client_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Client: {project.client_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions - Only Restore and Delete for archived projects */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleArchiveProject(project.id, false)}
                      title="Restore to Active"
                      className="font-medium"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
