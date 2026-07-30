'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Folder, Plus, Search, BookOpen, Menu, X, LogOut } from 'lucide-react';
import { Modal } from './Modal';

interface Project {
  id: string;
  name: string;
}

export function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const activeProjectId = params?.projectId as string | undefined;
  const currentSearchQuery = searchParams.get('q') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search input state
  const [searchVal, setSearchVal] = useState(currentSearchQuery);

  // New Project modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mobile sidebar toggle state
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Fetch projects from the API
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Watch for project update events (custom events we will dispatch)
    const handleProjectsUpdate = () => {
      fetchProjects();
    };
    window.addEventListener('projects-updated', handleProjectsUpdate);
    return () => {
      window.removeEventListener('projects-updated', handleProjectsUpdate);
    };
  }, []);

  // Update search input value if search query in URL changes (e.g. user clears search or navigates back)
  useEffect(() => {
    setSearchVal(currentSearchQuery);
  }, [currentSearchQuery]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);

    if (val.trim()) {
      router.push(`/?q=${encodeURIComponent(val)}`);
    } else {
      router.push('/');
    }
  };

  // Handle Create Project Submit
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
      } else {
        setNewProjectName('');
        setIsModalOpen(false);
        // Refresh local state
        await fetchProjects();
        // Dispatch global event for other components
        window.dispatchEvent(new Event('projects-updated'));
        // Navigate to new project
        router.push(`/projects/${data.id}`);
        setIsOpenMobile(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border px-4 py-6">
      {/* Header Logomark */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
          <BookOpen className="h-5 w-5" />
        </div>
        <Link href="/" className="font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity">
          KnowledgeBase
        </Link>
        <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground ml-auto">
          v1.0
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects, Q&A, files..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all-custom"
        />
      </div>

      {/* Projects Title and Add Button */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all-custom cursor-pointer"
          title="New Project"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {loading ? (
          <div className="space-y-2 p-2">
            <div className="h-7 bg-muted animate-pulse rounded-md" />
            <div className="h-7 bg-muted animate-pulse rounded-md" />
            <div className="h-7 bg-muted animate-pulse rounded-md" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-4">No projects created yet.</p>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId && !currentSearchQuery;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                onClick={() => setIsOpenMobile(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all-custom font-medium group ${
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Folder
                  className={`h-4 w-4 transition-all-custom shrink-0 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border mt-auto px-2 space-y-2">
        {session?.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-6 w-6 rounded-full shrink-0" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0">
                  {session.user.name?.charAt(0) || '?'}
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all-cursor cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Knowledge Base v1.0</p>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError('');
          setNewProjectName('');
        }}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium mb-1.5">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              required
              placeholder="e.g. Gumroad Products, Affiliate Marketing"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              disabled={submitting}
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setError('');
                setNewProjectName('');
              }}
              className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-secondary cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/95 font-medium cursor-pointer"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <Link href="/" className="font-semibold text-base tracking-tight">
            KnowledgeBase
          </Link>
        </div>
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-1.5 rounded-lg border border-border bg-secondary/50 text-foreground cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
          onClick={() => setIsOpenMobile(false)}
        >
          {/* Mobile Drawer Content */}
          <div
            className="w-72 h-full bg-card shadow-2xl relative animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpenMobile(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary border border-border cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-full pt-10">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
