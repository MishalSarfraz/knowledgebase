import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ projects: [], questions: [], files: [] });
    }

    const cleanedQuery = query.trim();

    // Query matching projects
    const projects = await db.project.findMany({
      where: {
        name: {
          contains: cleanedQuery,
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 10,
    });

    // Query matching questions
    const questions = await db.question.findMany({
      where: {
        OR: [
          { title: { contains: cleanedQuery } },
          { description: { contains: cleanedQuery } },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 15,
    });

    // Query matching files
    const files = await db.file.findMany({
      where: {
        OR: [
          { name: { contains: cleanedQuery } },
          { originalName: { contains: cleanedQuery } },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 15,
    });

    return NextResponse.json({
      projects,
      questions,
      files,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
