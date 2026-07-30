import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string; questionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { questionId } = await context.params;

    const question = await db.question.findUnique({
      where: { id: questionId },
      include: {
        answers: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { questionId } = await context.params;
    const { title, description } = await request.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Question title is required' }, { status: 400 });
    }

    const question = await db.question.update({
      where: { id: questionId },
      data: {
        title: title.trim(),
        description: (description || '').trim(),
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { questionId } = await context.params;

    await db.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
