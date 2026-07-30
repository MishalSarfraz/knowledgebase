import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const projects = await db.project.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const existingProject = await db.project.findUnique({
      where: { name: name.trim() },
    });

    if (existingProject) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
