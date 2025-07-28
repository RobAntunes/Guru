/**
 * Data Migration Service
 * Handles migration of existing data to project-based structure
 */

import { projectStorage } from './project-storage';
import { knowledgeBaseStorage } from './knowledge-base-storage';
import { documentStorage } from './document-storage';
import { specStorage } from './spec-storage';
import { promptStorage } from './prompt-storage';

interface MigrationResult {
  success: boolean;
  migratedKnowledgeBases: number;
  migratedDocuments: number;
  migratedSpecs: number;
  migratedPrompts: number;
  errors: string[];
}

class DataMigrationService {
  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(): Promise<boolean> {
    try {
      // Check if we have a migration flag
      const migrationCompleted = localStorage.getItem('guru_migration_v1_completed');
      if (migrationCompleted === 'true') {
        return false;
      }

      // Check if we have any data without project IDs
      const kbs = await knowledgeBaseStorage.getAllKnowledgeBases();
      const docs = await documentStorage.getAllDocuments();
      const specs = await specStorage.getAllSpecs();
      const prompts = await promptStorage.getAllTemplates();

      // If any data exists without projectId, migration is needed
      return (
        kbs.some(kb => !kb.projectId) ||
        docs.some(doc => !doc.projectId) ||
        specs.some(spec => !spec.projectId) ||
        prompts.some(prompt => !prompt.projectId)
      );
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Perform data migration to project structure
   */
  async migrateToProjects(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedKnowledgeBases: 0,
      migratedDocuments: 0,
      migratedSpecs: 0,
      migratedPrompts: 0,
      errors: []
    };

    try {
      // Ensure we have a default project
      let defaultProject = await projectStorage.getDefaultProject();
      if (!defaultProject) {
        defaultProject = await projectStorage.createProject(
          'Default Project',
          'Automatically created project for existing data'
        );
      }

      // Migrate knowledge bases
      try {
        const kbs = await knowledgeBaseStorage.getAllKnowledgeBases();
        for (const kb of kbs) {
          if (!kb.projectId) {
            kb.projectId = defaultProject.id;
            result.migratedKnowledgeBases++;
          }
        }
        if (result.migratedKnowledgeBases > 0) {
          await knowledgeBaseStorage.saveAllKnowledgeBases(kbs);
        }
      } catch (error) {
        result.errors.push(`Failed to migrate knowledge bases: ${error}`);
      }

      // Migrate documents
      try {
        await documentStorage.migrateDocumentsToProjects();
        const docs = await documentStorage.getAllDocuments();
        result.migratedDocuments = docs.filter(d => d.projectId === defaultProject.id).length;
      } catch (error) {
        result.errors.push(`Failed to migrate documents: ${error}`);
      }

      // Migrate specs
      try {
        await specStorage.migrateSpecsToProjects();
        const specs = await specStorage.getAllSpecs();
        result.migratedSpecs = specs.filter(s => s.projectId === defaultProject.id).length;
      } catch (error) {
        result.errors.push(`Failed to migrate specs: ${error}`);
      }

      // Migrate prompts
      try {
        await promptStorage.migrateTemplatesToProjects();
        const prompts = await promptStorage.getAllTemplates();
        result.migratedPrompts = prompts.filter(p => p.projectId === defaultProject.id).length;
      } catch (error) {
        result.errors.push(`Failed to migrate prompts: ${error}`);
      }

      // Update project metadata
      await projectStorage.updateProjectMetadata(defaultProject.id);

      // Mark migration as completed
      localStorage.setItem('guru_migration_v1_completed', 'true');
      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  /**
   * Reset migration (for testing purposes)
   */
  async resetMigration(): Promise<void> {
    localStorage.removeItem('guru_migration_v1_completed');
  }
}

export const dataMigration = new DataMigrationService();