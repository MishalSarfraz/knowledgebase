'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MessageSquare, 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Modal } from '@/components/Modal';

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  answers: Answer[];
}

interface Project {
  id: string;
  name: string;
}

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = params?.projectId as string;
  const questionId = params?.questionId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Question modal state
  const [isEditQuestionOpen, setIsEditQuestionOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [updatingQuestion, setUpdatingQuestion] = useState(false);

  // Add Answer form state
  const [newAnswerContent, setNewAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Edit Answer state
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');
  const [updatingAnswer, setUpdatingAnswer] = useState(false);

  // Fetch Project Name
  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Question Details
  const fetchQuestionDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/questions/${questionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push(`/projects/${projectId}`);
          return;
        }
        throw new Error('Failed to load question');
      }
      const data = await res.json();
      setQuestion(data);
      setEditTitle(data.title);
      setEditDesc(data.description);
    } catch (err) {
      console.error(err);
    }
  };

  // Load data on mount/id change
  useEffect(() => {
    if (!projectId || !questionId) return;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchQuestionDetails()]);
      setLoading(false);
    };

    loadAll();
  }, [projectId, questionId]);

  // Handle Delete Question
  const handleDeleteQuestion = async () => {
    if (!question) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this question and all of its answers? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push(`/projects/${projectId}`);
      } else {
        alert('Failed to delete question.');
      }
    } catch (err) {
      alert('An error occurred while deleting the question.');
    }
  };

  // Handle Edit Question Submit
  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setUpdatingQuestion(true);
    setQuestionError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setQuestionError(data.error || 'Failed to update question');
      } else {
        setQuestion((prev) => (prev ? { ...prev, title: data.title, description: data.description } : null));
        setIsEditQuestionOpen(false);
      }
    } catch (err) {
      setQuestionError('An error occurred. Please try again.');
    } finally {
      setUpdatingQuestion(false);
    }
  };

  // Handle Add Answer Submit
  const handleAddAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerContent.trim()) return;

    setSubmittingAnswer(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newAnswerContent }),
      });

      if (res.ok) {
        setNewAnswerContent('');
        // Re-fetch question to show new answer
        await fetchQuestionDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add answer.');
      }
    } catch (err) {
      alert('An error occurred while adding your answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Start Inline Answer Editing
  const startEditAnswer = (answerId: string, content: string) => {
    setEditingAnswerId(answerId);
    setEditAnswerContent(content);
  };

  // Handle Edit Answer Save
  const handleSaveAnswer = async (answerId: string) => {
    if (!editAnswerContent.trim()) return;

    setUpdatingAnswer(true);

    try {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editAnswerContent }),
      });

      if (res.ok) {
        setEditingAnswerId(null);
        setEditAnswerContent('');
        await fetchQuestionDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update answer.');
      }
    } catch (err) {
      alert('An error occurred while saving the answer.');
    } finally {
      setUpdatingAnswer(false);
    }
  };

  // Handle Delete Answer
  const handleDeleteAnswer = async (answerId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this answer?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchQuestionDetails();
      } else {
        alert('Failed to delete answer.');
      }
    } catch (err) {
      alert('An error occurred while deleting the answer.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading Q&amp;A details...</p>
      </div>
    );
  }

  if (!question || !project) return null;

  return (
    <div className="flex-1 px-6 md:px-12 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/projects/${projectId}`} className="hover:text-foreground truncate max-w-[120px]">{project.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[150px]">{question.title}</span>
        </div>

        {/* Back Link */}
        <Link 
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Project</span>
        </Link>

        {/* Question Panel */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-premium space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {question.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Asked: {new Date(question.createdAt).toLocaleDateString()}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated: {new Date(question.updatedAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsEditQuestionOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 border border-border hover:bg-secondary text-xs font-semibold rounded-lg transition-all-custom cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteQuestion}
                className="flex items-center gap-1 px-3 py-1.5 border border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 text-xs font-semibold rounded-lg transition-all-custom cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Description Body */}
          <div className="text-foreground leading-relaxed text-sm whitespace-pre-wrap font-sans bg-secondary/20 p-4 rounded-lg border border-border">
            {question.description || <p className="text-muted-foreground italic">No description provided.</p>}
          </div>
        </div>

        {/* Answers Header */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">Answers ({question.answers.length})</h2>
          </div>

          {/* Answers List */}
          {question.answers.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border border-dashed rounded-xl mb-6">
              <p className="text-sm text-muted-foreground">No answers yet. Share your knowledge by posting the first answer!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {question.answers.map((answer) => {
                const isEditing = editingAnswerId === answer.id;
                return (
                  <div 
                    key={answer.id} 
                    className="bg-card border border-border rounded-xl p-5 shadow-premium space-y-4 relative group"
                  >
                    {isEditing ? (
                      /* Inline Editing View */
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={editAnswerContent}
                          onChange={(e) => setEditAnswerContent(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none font-sans"
                          disabled={updatingAnswer}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setEditingAnswerId(null);
                              setEditAnswerContent('');
                            }}
                            className="px-2.5 py-1.5 border border-border hover:bg-secondary rounded-md cursor-pointer"
                            disabled={updatingAnswer}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveAnswer(answer.id)}
                            className="px-2.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold cursor-pointer"
                            disabled={updatingAnswer}
                          >
                            {updatingAnswer ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Static Read View */
                      <>
                        <div className="flex items-center justify-between gap-4 border-b border-border pb-2.5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="bg-secondary p-1 rounded-full text-foreground shrink-0">
                              <User className="h-3 w-3" />
                            </div>
                            <span className="font-semibold text-foreground">Team Member</span>
                            <span>&bull;</span>
                            <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                            {answer.createdAt !== answer.updatedAt && (
                              <>
                                <span>&bull;</span>
                                <span className="italic text-[10px]">Edited</span>
                              </>
                            )}
                          </div>
                          
                          {/* Answer Action Buttons (Visible on hover on desktop, always on mobile) */}
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditAnswer(answer.id, answer.content)}
                              className="p-1 border border-border hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all-custom cursor-pointer"
                              title="Edit Answer"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnswer(answer.id)}
                              className="p-1 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-md transition-all-custom cursor-pointer"
                              title="Delete Answer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                          {answer.content}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Answer Form */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-premium">
            <h3 className="font-semibold text-sm mb-3">Provide Answer</h3>
            <form onSubmit={handleAddAnswer} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Type your explanation or instruction here. Include step-by-step guidance, code configurations, or resources."
                value={newAnswerContent}
                onChange={(e) => setNewAnswerContent(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none font-sans"
                disabled={submittingAnswer}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow transition-all-custom cursor-pointer disabled:opacity-55"
                  disabled={submittingAnswer}
                >
                  {submittingAnswer && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submittingAnswer ? 'Posting...' : 'Post Answer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Question Dialog Modal */}
      <Modal
        isOpen={isEditQuestionOpen}
        onClose={() => {
          setIsEditQuestionOpen(false);
          setQuestionError('');
        }}
        title="Edit Question"
      >
        <form onSubmit={handleEditQuestion} className="space-y-4">
          <div>
            <label htmlFor="editQuestionTitle" className="block text-sm font-medium mb-1.5">
              Question Title
            </label>
            <input
              id="editQuestionTitle"
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              disabled={updatingQuestion}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="editQuestionDesc" className="block text-sm font-medium mb-1.5">
              Description / Details
            </label>
            <textarea
              id="editQuestionDesc"
              rows={4}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none font-sans"
              disabled={updatingQuestion}
            />
            {questionError && <p className="text-xs text-destructive mt-1.5">{questionError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditQuestionOpen(false);
                setQuestionError('');
              }}
              className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-secondary cursor-pointer"
              disabled={updatingQuestion}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/95 font-semibold cursor-pointer"
              disabled={updatingQuestion}
            >
              {updatingQuestion ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
