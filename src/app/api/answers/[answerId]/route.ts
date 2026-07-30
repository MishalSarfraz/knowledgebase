import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

type RouteContext = {
  params: Promise<{ answerId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { answerId } = await context.params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Answer content is required' }, { status: 400 });
    }

    const answer = await db.answer.update({
      where: { id: answerId },
      data: {
        content: content.trim(),
      },
    });

    // Optionally update the associated question's updatedAt timestamp
    await db.question.update({
      where: { id: answer.questionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(answer);
  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { answerId } = await context.params;

    const answer = await db.answer.delete({
      where: { id: answerId },
    });

    // Optionally update the associated question's updatedAt timestamp
    await db.question.update({
      where: { id: answer.questionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
