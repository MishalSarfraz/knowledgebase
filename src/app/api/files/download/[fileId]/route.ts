import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { fileId } = await context.params;

    const fileRecord = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return new Response('File not found', { status: 404 });
    }

    return NextResponse.redirect(fileRecord.filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
