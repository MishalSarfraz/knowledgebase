'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  HelpCircle, 
  FileText, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  ExternalLink,
  MessageSquare,
  FileIcon,
  ChevronRight,
  Loader2,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { Modal } from '@/components/Modal';

interface Project {
  id: string;
  name: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    answers: number;
  };
}

interface FileRecord {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const getFileIcon = (fileName: string, mimeType: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = (mimeType || '').toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '') || mime.startsWith('image/')) {
    return <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '') || mime.includes('zip') || mime.includes('compressed')) {
    return <FileArchive className="h-4 w-4 text-amber-500 shrink-0" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '') || mime.includes('spreadsheet') || mime.includes('excel')) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
  if (['doc', 'docx'].includes(ext || '') || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
    return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (ext === 'pdf' || mime.includes('pdf')) {
    return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
  }
  if (['md', 'markdown', 'txt'].includes(ext || '')) {
    return <FileText className="h-4 w-4 text-zinc-500 shrink-0" />;
  }
  if (['html', 'css', 'js', 'ts', 'tsx', 'json'].includes(ext || '')) {
    return <FileCode className="h-4 w-4 text-cyan-600 shrink-0" />;
  }
  return <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const projectId = params?.projectId as string;
  const currentTab = searchParams.get('tab') === 'files' ? 'files' : 'questions';

  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  // Rename Project Dialog state
  const [isRenameProjectOpen, setIsRenameProjectOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);

  // Ask Question Dialog state
  const [isAskQuestionOpen, setIsAskQuestionOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Rename File Dialog state
  const [isRenameFileOpen, setIsRenameFileOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [updatingFile, setUpdatingFile] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Project Details
  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load project');
      }
      const data = await res.json();
      setProject(data);
      setEditProjectName(data.name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProject(false);
    }
  };

  // Fetch Questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Files
  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load project on mount/id change
  useEffect(() => {
    if (!projectId) return;
    setLoadingProject(true);
    fetchProjectDetails();
  }, [projectId]);

  // Fetch tab content when tab or projectId changes
  useEffect(() => {
    if (!projectId) return;
    const loadTabContent = async () => {
      setLoadingContent(true);
      if (currentTab === 'questions') {
        await fetchQuestions();
      } else {
        await fetchFiles();
      }
      setLoadingContent(false);
    };
    loadTabContent();
  }, [projectId, currentTab]);

  // Handle Project Delete
  const handleDeleteProject = async () => {
    if (!project) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the project "${project.name}"?\n\nThis will permanently delete all associated questions, answers, and uploaded files. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Dispatch global event so sidebar refreshes
        window.dispatchEvent(new Event('projects-updated'));
        router.push('/');
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } catch (err) {
      alert('An error occurred while deleting project.');
    }
  };

  // Handle Project Rename Submit
  const handleRenameProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectName.trim() || !project) return;

    setUpdatingProject(true);
    setProjectError('');

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editProjectName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProjectError(data.error || 'Failed to rename project');
      } else {
        setProject(data);
        setIsRenameProjectOpen(false);
        // Refresh sidebar
        window.dispatchEvent(new Event('projects-updated'));
      }
    } catch (err) {
      setProjectError('An error occurred. Please try again.');
    } finally {
      setUpdatingProject(false);
    }
  };

  // Handle Ask Question Submit
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionTitle.trim()) return;

    setSubmittingQuestion(true);
    setQuestionError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: questionTitle,
          description: questionDesc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setQuestionError(data.error || 'Failed to create question');
      } else {
        setQuestionTitle('');
        setQuestionDesc('');
        setIsAskQuestionOpen(false);
        // Refresh question list
        await fetchQuestions();
      }
    } catch (err) {
      setQuestionError('An error occurred. Please try again.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Handle File Upload Select
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // Clear file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Refresh files list
        await fetchFiles();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to upload file.');
      }
    } catch (err) {
      alert('An error occurred while uploading the file.');
    } finally {
      setUploading(false);
    }
  };

  // Handle File Rename Submit
  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFileName.trim() || !activeFileId) return;

    setUpdatingFile(true);
    setFileError('');

    try {
      const res = await fetch(`/api/files/${activeFileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFileName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFileError(data.error || 'Failed to rename file');
      } else {
        setIsRenameFileOpen(false);
        setActiveFileId(null);
        setEditFileName('');
        await fetchFiles();
      }
    } catch (err) {
      setFileError('An error occurred. Please try again.');
    } finally {
      setUpdatingFile(false);
    }
  };

  // Handle File Delete
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${fileName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchFiles();
      } else {
        alert('Failed to delete file.');
      }
    } catch (err) {
      alert('An error occurred while deleting the file.');
    }
  };

  // Format File Size
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Switch Tab
  const setTab = (tabName: 'questions' | 'files') => {
    router.push(`/projects/${projectId}?tab=${tabName}`);
  };

  if (loadingProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading project details...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Project Header */}
      <div className="bg-card border-b border-border px-6 md:px-12 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground truncate max-w-[120px]">{project.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate max-w-[300px] md:max-w-[450px]">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsRenameProjectOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-secondary text-xs font-semibold rounded-lg transition-all-custom cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Rename</span>
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 text-xs font-semibold rounded-lg transition-all-custom cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="max-w-4xl mx-auto flex gap-1 mt-8 border-b border-border -mb-6">
          <button
            onClick={() => setTab('questions')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all-custom cursor-pointer ${
              currentTab === 'questions'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setTab('files')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all-custom cursor-pointer ${
              currentTab === 'files'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Files
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 px-6 md:px-12 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {currentTab === 'questions' ? (
            /* Questions Tab Pane */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Project Q&amp;A</h2>
                  <p className="text-xs text-muted-foreground">Ask team questions and view historical answers.</p>
                </div>
                <button
                  onClick={() => setIsAskQuestionOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow transition-all-custom cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ask Question</span>
                </button>
              </div>

              {loadingContent ? (
                <div className="space-y-3">
                  <div className="h-24 bg-muted animate-pulse rounded-xl" />
                  <div className="h-24 bg-muted animate-pulse rounded-xl" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl">
                  <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                  <h3 className="font-semibold text-lg">No questions yet</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                    Have a query about Gumroad, marketing, or operations? Go ahead and ask the team!
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {questions.map((q) => (
                    <Link
                      key={q.id}
                      href={`/projects/${projectId}/questions/${q.id}`}
                      className="block p-5 bg-card border border-border rounded-xl hover:bg-secondary/40 hover:border-dark-border transition-all-custom shadow-premium group"
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                          {q.title}
                        </h3>
                        <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                          <MessageSquare className="h-3 w-3" />
                          <span>{q._count.answers}</span>
                        </div>
                      </div>
                      
                      {q.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {q.description}
                        </p>
                      )}

                      <div className="flex items-center text-xs text-muted-foreground gap-3">
                        <span>Asked: {new Date(q.createdAt).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span>Active: {new Date(q.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Files Tab Pane */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Project Files</h2>
                  <p className="text-xs text-muted-foreground">Upload reference sheets, images, TXT guidelines, and ZIP docs.</p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow transition-all-custom cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </div>
              </div>

              {loadingContent ? (
                <div className="space-y-2">
                  <div className="h-12 bg-muted animate-pulse rounded-lg" />
                  <div className="h-12 bg-muted animate-pulse rounded-lg" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                  <h3 className="font-semibold text-lg">No files uploaded</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                    Keep references close by. Drag or select files to store them inside the project uploads folder.
                  </p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl shadow-premium overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground">
                          <th className="px-4 py-3">File Name</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">Uploaded Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {files.map((file) => (
                          <tr key={file.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-foreground max-w-[200px] md:max-w-[320px]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {getFileIcon(file.name, file.mimeType)}
                                <span className="truncate" title={file.name}>
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground shrink-0">
                              {formatBytes(file.size)}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground shrink-0">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`/api/files/download/${file.id}`}
                                  className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all-custom cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={() => {
                                    setActiveFileId(file.id);
                                    setEditFileName(file.name);
                                    setIsRenameFileOpen(true);
                                  }}
                                  className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all-custom cursor-pointer"
                                  title="Rename"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  className="p-1.5 border border-destructive/20 text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all-custom cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rename Project Dialog Modal */}
      <Modal
        isOpen={isRenameProjectOpen}
        onClose={() => {
          setIsRenameProjectOpen(false);
          setProjectError('');
        }}
        title="Rename Project"
      >
        <form onSubmit={handleRenameProject} className="space-y-4">
          <div>
            <label htmlFor="editProjectName" className="block text-sm font-medium mb-1.5">
              New Project Name
            </label>
            <input
              id="editProjectName"
              type="text"
              required
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              disabled={updatingProject}
              autoFocus
            />
            {projectError && <p className="text-xs text-destructive mt-1.5">{projectError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRenameProjectOpen(false);
                setProjectError('');
              }}
              className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-secondary cursor-pointer"
              disabled={updatingProject}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/95 font-semibold cursor-pointer"
              disabled={updatingProject}
            >
              {updatingProject ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ask Question Dialog Modal */}
      <Modal
        isOpen={isAskQuestionOpen}
        onClose={() => {
          setIsAskQuestionOpen(false);
          setQuestionError('');
          setQuestionTitle('');
          setQuestionDesc('');
        }}
        title="Ask a Question"
      >
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <div>
            <label htmlFor="questionTitle" className="block text-sm font-medium mb-1.5">
              Question Title
            </label>
            <input
              id="questionTitle"
              type="text"
              required
              placeholder="e.g. How do we configure Gumroad webhook url?"
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              disabled={submittingQuestion}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="questionDesc" className="block text-sm font-medium mb-1.5">
              Description / Details
            </label>
            <textarea
              id="questionDesc"
              rows={4}
              placeholder="Provide background context, code snippets, or specify what exactly you need help with."
              value={questionDesc}
              onChange={(e) => setQuestionDesc(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none font-sans"
              disabled={submittingQuestion}
            />
            {questionError && <p className="text-xs text-destructive mt-1.5">{questionError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAskQuestionOpen(false);
                setQuestionError('');
                setQuestionTitle('');
                setQuestionDesc('');
              }}
              className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-secondary cursor-pointer"
              disabled={submittingQuestion}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/95 font-semibold cursor-pointer"
              disabled={submittingQuestion}
            >
              {submittingQuestion ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rename File Dialog Modal */}
      <Modal
        isOpen={isRenameFileOpen}
        onClose={() => {
          setIsRenameFileOpen(false);
          setFileError('');
          setActiveFileId(null);
          setEditFileName('');
        }}
        title="Rename File"
      >
        <form onSubmit={handleRenameFile} className="space-y-4">
          <div>
            <label htmlFor="editFileName" className="block text-sm font-medium mb-1.5">
              File Name
            </label>
            <input
              id="editFileName"
              type="text"
              required
              value={editFileName}
              onChange={(e) => setEditFileName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              disabled={updatingFile}
              autoFocus
            />
            {fileError && <p className="text-xs text-destructive mt-1.5">{fileError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRenameFileOpen(false);
                setFileError('');
                setActiveFileId(null);
                setEditFileName('');
              }}
              className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-secondary cursor-pointer"
              disabled={updatingFile}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/95 font-semibold cursor-pointer"
              disabled={updatingFile}
            >
              {updatingFile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
