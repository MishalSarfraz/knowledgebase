import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
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
