import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Plus,
  Settings,
  Trash2,
  FolderOpen,
  Clock,
  FileText,
  Database,
  Code,
  BookTemplate,
  MoreVertical,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { projectStorage, Project } from '../services/project-storage';

interface ProjectSelectorProps {
  onProjectChange?: (project: Project) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onProjectChange }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProjects();
    
    // Listen for project switch events
    const handleProjectSwitch = (event: CustomEvent) => {
      // Skip callback to avoid infinite loop
      loadProjects(true);
    };
    
    window.addEventListener('project-switched', handleProjectSwitch as EventListener);
    return () => {
      window.removeEventListener('project-switched', handleProjectSwitch as EventListener);
    };
  }, []);

  const loadProjects = async (skipCallback = false) => {
    const allProjects = await projectStorage.getAllProjects();
    setProjects(allProjects);
    
    const current = await projectStorage.getCurrentProject();
    setCurrentProject(current);
    
    // Only call onProjectChange if not skipping (to avoid infinite loops)
    if (!skipCallback && current && onProjectChange) {
      onProjectChange(current);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    try {
      const newProject = await projectStorage.createProject(
        newProjectName.trim(),
        newProjectDescription.trim()
      );
      
      // Switch to the new project
      await projectStorage.switchToProject(newProject.id);
      
      setShowCreateDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchProject = async (project: Project) => {
    await projectStorage.switchToProject(project.id);
    await loadProjects();
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await projectStorage.deleteProject(projectToDelete.id);
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      // TODO: Show error toast
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      const duplicated = await projectStorage.duplicateProject(
        project.id,
        `${project.name} (Copy)`
      );
      await loadProjects();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
    }
  };

  if (!currentProject) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-auto p-2 justify-start hover:bg-accent/50"
          >
            <div className="flex items-center gap-2 w-full">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: currentProject.color }}
              />
              <span className="text-sm truncate flex-1 text-left">{currentProject.name}</span>
              <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
          
          {projects.map(project => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleSwitchProject(project)}
              className="gap-2 py-2"
            >
              <div className="flex-1 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{project.name}</span>
                    {project.id === currentProject.id && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        Current
                      </Badge>
                    )}
                  </div>
                  {project.metadata && (
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {project.metadata.knowledgeBaseCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {project.metadata.documentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {project.metadata.specCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                    <Copy className="h-3 w-3 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setProjectToDelete(project);
                      setShowDeleteDialog(true);
                    }}
                    disabled={projects.length === 1}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Projects help you organize your knowledge bases, specifications, and prompts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My New Project"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This will permanently delete all associated knowledge bases, documents, specifications, and prompts.
            </DialogDescription>
          </DialogHeader>
          
          {projectToDelete && projectToDelete.metadata && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">This project contains:</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>{projectToDelete.metadata.knowledgeBaseCount} knowledge bases</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{projectToDelete.metadata.documentCount} documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span>{projectToDelete.metadata.specCount} specifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookTemplate className="h-4 w-4" />
                  <span>{projectToDelete.metadata.promptCount} prompt templates</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setProjectToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};