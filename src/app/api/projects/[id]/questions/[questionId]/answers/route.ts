import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

type RouteContext = {
  params: Promise<{ id: string; questionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { questionId } = await context.params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Answer content is required' }, { status: 400 });
    }

    const answer = await db.answer.create({
      data: {
        content: content.trim(),
        questionId: questionId,
      },
    });

    // Update the question's updatedAt timestamp to reflect new activity
    await db.question.update({
      where: { id: questionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
