'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Folder, 
  HelpCircle, 
  FileText, 
  Download, 
  ArrowRight, 
  Search, 
  Users, 
  BookOpen,
  ArrowUpRight,
  Database
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
}

interface FileRecord {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
}

interface SearchResults {
  projects: Project[];
  questions: Question[];
  files: FileRecord[];
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';

  const [results, setResults] = useState<SearchResults>({ projects: [], questions: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], questions: [], files: [] });
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setError('Failed to fetch search results');
        }
      } catch (err) {
        setError('Error fetching search results');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search requests slightly
    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Helper to format file sizes
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const hasResults = results.projects.length > 0 || results.questions.length > 0 || results.files.length > 0;

  return (
    <div className="flex-1 px-6 md:px-12 py-10 max-w-4xl mx-auto w-full">
      {query.trim() ? (
        // Search Results State
        <div className="space-y-8 animate-in fade-in duration-200">
          <div>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Search Results</span>
            <h1 className="text-2xl font-bold mt-1">
              Showing matches for &ldquo;<span className="text-primary">{query}</span>&rdquo;
            </h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-muted animate-pulse rounded-xl" />
              <div className="h-20 bg-muted animate-pulse rounded-xl" />
              <div className="h-20 bg-muted animate-pulse rounded-xl" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !hasResults ? (
            <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold text-lg">No results found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                We couldn&apos;t find any projects, questions, or files matching that term.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Matching Projects */}
              {results.projects.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Projects ({results.projects.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {results.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary/40 hover:border-dark-border transition-all-custom shadow-premium group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{project.name}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Questions */}
              {results.questions.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Questions &amp; Answers ({results.questions.length})
                  </h2>
                  <div className="space-y-3">
                    {results.questions.map((question) => (
                      <Link
                        key={question.id}
                        href={`/projects/${question.projectId}/questions/${question.id}`}
                        className="block p-4 bg-card border border-border rounded-xl hover:bg-secondary/40 hover:border-dark-border transition-all-custom shadow-premium group"
                      >
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground">
                          <span className="font-medium hover:underline">{question.project.name}</span>
                          <span>&bull;</span>
                          <span>Question</span>
                        </div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors mb-1">
                          {question.title}
                        </h3>
                        {question.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Files */}
              {results.files.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Files ({results.files.length})
                  </h2>
                  <div className="space-y-2">
                    {results.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-premium group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-secondary p-2 rounded-lg text-muted-foreground">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{file.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Link 
                                href={`/projects/${file.projectId}`} 
                                className="font-medium hover:underline text-muted-foreground"
                              >
                                {file.project.name}
                              </Link>
                              <span>&bull;</span>
                              <span>{formatBytes(file.size)}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`/api/files/download/${file.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-secondary rounded-lg text-xs font-semibold transition-all-custom cursor-pointer ml-4"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Welcome / Default Dashboard State
        <div className="space-y-10 py-4 animate-in fade-in duration-300">
          {/* Welcome Card */}
          <div className="p-8 bg-card border border-border rounded-2xl shadow-premium relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-[0.02] pointer-events-none">
              <BookOpen className="h-96 w-96" />
            </div>

            <div className="max-w-xl">
              <span className="text-xs font-semibold bg-secondary border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                Team Knowledge Hub
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4 mb-3">
                Simplify how your team stores and shares information.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Welcome to the shared internal knowledge base. Select a project in the sidebar to ask questions, view responses, and download shared files.
              </p>
              <div className="flex flex-wrap gap-6 text-xs text-muted-foreground font-medium border-t border-border pt-5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-foreground" />
                  <span>35 Trusted Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-foreground" />
                  <span>SQLite Database Powered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
              Getting Started
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 bg-card border border-border rounded-xl shadow-premium">
                <div className="h-8 w-8 bg-secondary rounded-lg flex items-center justify-center font-semibold text-sm mb-3">
                  1
                </div>
                <h3 className="font-semibold text-sm mb-1">Create or Select a Project</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use the sidebar to create new projects like marketing strategies, internal operations, or product catalogs.
                </p>
              </div>
              
              <div className="p-5 bg-card border border-border rounded-xl shadow-premium">
                <div className="h-8 w-8 bg-secondary rounded-lg flex items-center justify-center font-semibold text-sm mb-3">
                  2
                </div>
                <h3 className="font-semibold text-sm mb-1">Collaborative Q&amp;A</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask clear questions and post answers instantly. Everyone can edit or refine everything to keep data accurate.
                </p>
              </div>

              <div className="p-5 bg-card border border-border rounded-xl shadow-premium">
                <div className="h-8 w-8 bg-secondary rounded-lg flex items-center justify-center font-semibold text-sm mb-3">
                  3
                </div>
                <h3 className="font-semibold text-sm mb-1">Upload Documents</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Store original assets, images, spreadsheets, or instructions. Downloads are fast and files are kept locally.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
