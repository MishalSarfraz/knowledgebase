import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import fs from 'fs';
import path from 'path';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { id } = await context.params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            files: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { id } = await context.params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const existingProject = await db.project.findUnique({
      where: { name: name.trim() },
    });

    if (existingProject && existingProject.id !== id) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 400 });
    }

    const project = await db.project.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { id } = await context.params;

    // Fetch all files associated with this project so we can delete them from disk
    const files = await db.file.findMany({
      where: { projectId: id },
    });

    // Delete files from filesystem
    const uploadsDir = path.join(process.cwd(), 'uploads');
    for (const file of files) {
      const filePath = path.join(uploadsDir, file.filePath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete file from disk: ${filePath}`, err);
        }
      }
    }

    // Delete project from database (cascades questions, answers, and files thanks to database schema relations)
    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
