import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/r2';

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
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
    const { fileId } = await context.params;

    const fileRecord = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
      await deleteFile(fileRecord.filePath);
    } catch (err) {
      console.error('Failed to delete file from R2:', err);
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
