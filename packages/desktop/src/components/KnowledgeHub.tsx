import { useState, useEffect } from 'react';
import { guruService, KnowledgeBase, QueryResult } from '../services/guru-integration';
import { documentStorage } from '../services/document-storage';
import { knowledgeBaseStorage } from '../services/knowledge-base-storage';
import { documentGroupsStorage } from '../services/document-groups-storage';
import { CreateKBDialog } from './CreateKBDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Database, Clock, Upload, Trash2, Plus, Search, FolderOpen, ChevronRight, ArrowUpDown, LucideArrowUpDown, ArrowLeft, Cross, Delete, RemoveFormatting, DeleteIcon, Eye } from 'lucide-react';
import { CognitiveInsightsPanel } from './CognitiveInsightsPanel';
import { DocumentPreview } from './DocumentPreview';
import { DocumentOrganizer } from './DocumentOrganizer';

interface KnowledgeHubProps {
  knowledgeBases: KnowledgeBase[];
  setKnowledgeBases: (kbs: KnowledgeBase[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function KnowledgeHub({ knowledgeBases, setKnowledgeBases, isLoading, setIsLoading }: KnowledgeHubProps) {
  const [selectedKB, setSelectedKB] = useState<string | null>(null);
  const [showCreateKBDialog, setShowCreateKBDialog] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<QueryResult | null>(null);
  const [kbDocuments, setKbDocuments] = useState<Record<string, Array<{
    id: string;
    filename: string;
    category: string;
    sizeBytes: number;
    wordCount: number;
    addedAt: Date;
    metadata?: any;
  }>>>({});
  const [showDocumentBrowser, setShowDocumentBrowser] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Load documents and knowledge bases from local storage when component mounts
  useEffect(() => {
    loadKnowledgeBasesFromStorage();
    loadDocumentsFromStorage();
  }, []);

  // Load documents for selected KB
  useEffect(() => {
    if (selectedKB) {
      loadKBDocumentsFromStorage(selectedKB);
    }
  }, [selectedKB]);

  const loadKnowledgeBasesFromStorage = async () => {
    try {
      const storedKBs = await knowledgeBaseStorage.getAllKnowledgeBases();
      setKnowledgeBases(storedKBs);
    } catch (error) {
      console.error('Failed to load knowledge bases from storage:', error);
    }
  };

  const loadDocumentsFromStorage = async () => {
    try {
      // Load all documents and organize by KB
      const allDocs = await documentStorage.getAllDocuments();
      const docsByKB: Record<string, any[]> = {};

      allDocs.forEach(doc => {
        if (!docsByKB[doc.knowledgeBaseId]) {
          docsByKB[doc.knowledgeBaseId] = [];
        }
        docsByKB[doc.knowledgeBaseId].push({
          id: doc.id,
          filename: doc.filename,
          category: doc.category,
          sizeBytes: 0,
          wordCount: 0,
          addedAt: new Date(doc.addedAt),
          metadata: doc.metadata
        });
      });

      setKbDocuments(docsByKB);
    } catch (error) {
      console.error('Failed to load documents from storage:', error);
    }
  };

  const loadKBDocumentsFromStorage = async (kbId: string) => {
    try {
      const docs = await documentStorage.getDocumentsByKB(kbId);
      const formattedDocs = docs.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        category: doc.category,
        sizeBytes: 0,
        wordCount: 0,
        addedAt: new Date(doc.addedAt),
        metadata: doc.metadata
      }));

      setKbDocuments(prev => ({
        ...prev,
        [kbId]: formattedDocs
      }));
    } catch (error) {
      console.error('Failed to load KB documents from storage:', error);
    }
  };

  const loadKBDocuments = async () => {
    if (!selectedKB) return;

    const kb = knowledgeBases.find(k => k.id === selectedKB);
    if (!kb) return;

    console.log('loadKBDocuments called for KB:', kb.name);
    setIsLoading(true);
    try {
      const docs = await guruService.listDocumentsInKnowledgeBase(kb.name);
      console.log('Loaded documents:', docs);
      setKbDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
    setIsLoading(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedKB) return;

    try {
      // Only delete from local storage - we're not actually deleting files from disk
      await documentStorage.deleteDocument(documentId);

      // Update local state
      setKbDocuments(prevDocs => ({
        ...prevDocs,
        [selectedKB]: (prevDocs[selectedKB] || []).filter(doc => doc.id !== documentId)
      }));

      // Update KB document count in storage
      const newCount = Math.max(0, (kbDocuments[selectedKB] || []).length - 1);
      await knowledgeBaseStorage.updateKnowledgeBase(selectedKB, {
        documentCount: newCount
      });

      // Update local state
      setKnowledgeBases(prevKBs =>
        prevKBs.map(kb =>
          kb.id === selectedKB
            ? { ...kb, documentCount: newCount }
            : kb
        )
      );
    } catch (error) {
      console.error('Failed to remove document:', error);
    }
  };

  const handleDeleteKnowledgeBase = async (kbId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    const kb = knowledgeBases.find(k => k.id === kbId);
    if (!kb) return;

    if (!confirm(`Delete knowledge base "${kb.name}"?\n\nThis will remove the knowledge base and all its documents from your local index.`)) {
      return;
    }

    try {
      // Delete all documents for this KB
      await documentStorage.deleteDocumentsByKB(kbId);

      // Delete the KB itself
      await knowledgeBaseStorage.deleteKnowledgeBase(kbId);

      // Update local state
      setKnowledgeBases(prevKBs => prevKBs.filter(k => k.id !== kbId));
      setKbDocuments(prevDocs => {
        const newDocs = { ...prevDocs };
        delete newDocs[kbId];
        return newDocs;
      });

      // If we just deleted the selected KB, deselect it
      if (selectedKB === kbId) {
        setSelectedKB(null);
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      alert('Failed to delete knowledge base');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedKB) return;

    console.log('Opening file dialog...');
    const filePaths = await guruService.openFileDialog({
      multiple: true,
      filters: [
        { name: 'Documents', extensions: ['pdf', 'txt', 'md', 'doc', 'docx'] },
        { name: 'Code', extensions: ['js', 'ts', 'py', 'java', 'cpp', 'jsx', 'tsx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }) as string[];

    console.log('Selected files:', filePaths);

    if (filePaths && filePaths.length > 0) {
      setIsLoading(true);
      try {
        // Read files and add directly to knowledge base
        const documents = await Promise.all(filePaths.map(async (path) => {
          const content = await guruService.readFileAsBase64(path);
          const filename = path.split('/').pop() || path;
          return {
            filename,
            content,
            isBase64: true,
            category: 'general'
          };
        }));

        console.log('Documents prepared:', documents.length);

        // Add documents to knowledge base
        // Backend expects the KB name, not ID
        const kb = knowledgeBases.find(k => k.id === selectedKB);
        if (!kb) {
          throw new Error('Knowledge base not found');
        }

        const result = await guruService.addDocumentsToKnowledgeBase(
          kb.name,
          documents,
          {
            enableCognitiveAnalysis: true,
            chunkDocuments: true
          }
        );

        console.log('Add documents result:', result);

        // Since the backend has a bug where listDocuments returns empty,
        // we'll use the uploaded documents from the response
        if (result.addedDocuments && result.addedDocuments.length > 0) {
          const newDocs = result.addedDocuments.map((doc: any) => ({
            id: doc.id,
            filename: doc.filename,
            category: doc.category || 'general',
            sizeBytes: 0, // Not provided by backend
            wordCount: 0, // Not provided by backend
            addedAt: new Date(),
            metadata: doc.metadata
          }));

          // Save to storage
          const storageDocs = newDocs.map(doc => ({
            ...doc,
            content: documents.find(d => d.filename === doc.filename)?.content || '',
            isBase64: true
          }));

          await documentStorage.addDocuments(selectedKB, storageDocs);

          // Add new documents to the "Ungrouped" group
          const groups = await documentGroupsStorage.getGroupsByKB(selectedKB);
          let ungroupedGroup = groups.find(g => g.name === 'Ungrouped');

          // Create Ungrouped group if it doesn't exist
          if (!ungroupedGroup) {
            ungroupedGroup = await documentGroupsStorage.createGroup(
              selectedKB,
              'Ungrouped',
              'Documents not assigned to any group'
            );
          }

          // Add all new documents to the ungrouped group
          for (const doc of newDocs) {
            await documentGroupsStorage.addDocumentToGroup(doc.id, ungroupedGroup.id);
          }

          // Add new documents to the specific KB
          setKbDocuments(prevDocs => ({
            ...prevDocs,
            [selectedKB]: [...(prevDocs[selectedKB] || []), ...newDocs]
          }));

          // Update KB document count in storage
          const updatedCount = (kbDocuments[selectedKB] || []).length + newDocs.length;
          await knowledgeBaseStorage.updateKnowledgeBase(selectedKB, {
            documentCount: updatedCount
          });

          // Update local state with new document count
          setKnowledgeBases(prevKBs =>
            prevKBs.map(kb =>
              kb.id === selectedKB
                ? { ...kb, documentCount: updatedCount }
                : kb
            )
          );
        }
      } catch (error) {
        console.error("Failed to upload files:", error);
        alert(`Failed to upload files: ${error}`);
      }
      setIsLoading(false);
    }
  };


  const getDocumentContent = async (docId: string): Promise<string | null> => {
    try {
      const allDocs = await documentStorage.getAllDocuments();
      const doc = allDocs.find(d => d.id === docId);
      return doc?.content || null;
    } catch (error) {
      console.error('Failed to get document content:', error);
      return null;
    }
  };

  const handleRAGQuery = async () => {
    if (!selectedKB || !ragQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await guruService.queryKnowledgeBase(
        selectedKB,
        ragQuery,
        {
          includeCognitiveInsights: true,
          responseMode: 'comprehensive'
        }
      );
      setRagResults(result);
    } catch (error) {
      console.error("RAG query failed:", error);
    }
    setIsLoading(false);
  };

  const selectedKBData = knowledgeBases.find(kb => kb.id === selectedKB);

  return (

    <div className="flex flex-col h-full overflow-hidden">
      {/* Back Button */}
      {/* Header */}
      <div className='flex justify-between'>
        <div className="flex justify-between flex-shrink-0">
          <div className='flex items-start gap-2 flex-col'>
            {selectedKB && (
              <button
                onClick={() => setSelectedKB(null)}
                className="gap-2 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-2xl font-light tracking-tight text-left">{selectedKBData?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 text-left mb-4">{selectedKBData?.description}</p>
          </div>
        </div>
        {!selectedKB && <Button
          onClick={() => setShowCreateKBDialog(true)}
          size="sm"
          variant="default"
          className="!text-xs !bg-neutral-900 !py-4 !text-white"
        >
          <Plus className="h-3 w-3 mr-1" />
          New Knowledge Base
        </Button>}
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Content */}
        <div className="flex-1 flex flex-col space-y-6 overflow-y-auto">
          {/* Info Box */}
          {knowledgeBases.length === 0 && (
            <div className="flex h-full justify-center items-center">
              <Card className="border-muted max-w-xl mx-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal">Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Knowledge bases are your personal document repositories. They store your files persistently and allow AI to answer questions based on their content.
                    Create a knowledge base, upload documents, and start querying!
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Knowledge Base Selection */}
          {knowledgeBases.length > 0 && !selectedKB && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBases.map((kb) => (
                <Card
                  key={kb.id}
                  className={`cursor-pointer transition-all border-muted hover:border-muted-foreground/20`}
                  onClick={() => setSelectedKB(kb.id)}
                >
                  <CardHeader className="pb-3 relative">
                    <button
                      onClick={(e) => handleDeleteKnowledgeBase(kb.id, e)}
                      className="absolute top-4 right-4 p-1 rounded hover:bg-destructive/20 transition-colors"
                      title="Delete knowledge base"
                    >
                      <Delete className="h-3 w-3" />
                    </button>
                    <CardTitle className="text-base font-normal">{kb.name}</CardTitle>
                    <CardDescription className="text-xs">{kb.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{kb.documentCount} documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Updated: {new Date(kb.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Document Upload Section */}
          {selectedKBData && (
            <Card className="border-muted h-full">
              <CardHeader className='flex flex-row justify-between items-center'>
                <CardTitle className="text-lg font-normal">Resources</CardTitle>
                <CardDescription className="text-xs"><em>Click to preview</em></CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 h-[85%]">
                {/* Document Organizer */}
                <div className="flex-1 overflow-hidden">
                  <DocumentOrganizer
                    knowledgeBaseId={selectedKB}
                    documents={kbDocuments[selectedKB] || []}
                    onDocumentSelect={setSelectedDocument}
                    onDocumentDelete={handleDeleteDocument}
                    onDocumentToggle={() => {
                      // Force refresh of documents to update CognitiveInsightsPanel
                      loadKBDocumentsFromStorage(selectedKB);
                    }}
                    onGroupsChange={() => {
                      // Force refresh when groups are added/deleted
                      loadKBDocumentsFromStorage(selectedKB);
                    }}
                  />
                </div>

                {/* Upload Button */}
                <div className='flex justify-end'>
                  <Button
                    onClick={handleFileUpload}
                    size="sm"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Cognitive Insights */}
        {selectedKB && (
          <div className="w-96 h-full overflow-hidden">
            <CognitiveInsightsPanel
              knowledgeBaseId={selectedKB}
              documents={kbDocuments[selectedKB] || []}
              knowledgeBase={selectedKBData ? {
                name: selectedKBData.name,
                description: selectedKBData.description,
                documentCount: selectedKBData.documentCount,
                chunkCount: selectedKBData.chunkCount,
                lastUpdated: selectedKBData.lastUpdated
              } : undefined}
              onDocumentToggle={() => {
                loadKBDocumentsFromStorage(selectedKB);
              }}
            />
          </div>
        )}
      </div>

      <CreateKBDialog
        isOpen={showCreateKBDialog}
        onClose={() => setShowCreateKBDialog(false)}
        onCreate={async (name, description) => {
          // Create KB in local storage
          const newKB = await knowledgeBaseStorage.createKnowledgeBase(name, description);

          // Update local state
          setKnowledgeBases(prevKBs => [...prevKBs, newKB]);
        }}
      />

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          getDocumentContent={getDocumentContent}
        />
      )}
    </div >
  );
}