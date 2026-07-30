import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const questions = await db.question.findMany({
      where: { projectId: id },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { title, description } = await request.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Question title is required' }, { status: 400 });
    }

    const question = await db.question.create({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        projectId: id,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
