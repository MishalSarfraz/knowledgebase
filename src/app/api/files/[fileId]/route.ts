import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { deleteFile } from '@/lib/storage';

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { fileId } = await context.params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const updatedFile = await db.file.update({
      where: { id: fileId },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { fileId } = await context.params;

    const fileRecord = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const key = fileRecord.filePath.split('/f/').pop();
    if (key) {
      try {
        await deleteFile(key);
      } catch (err) {
        console.error('Failed to delete file from Uploadthing:', err);
      }
    }

    await db.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
