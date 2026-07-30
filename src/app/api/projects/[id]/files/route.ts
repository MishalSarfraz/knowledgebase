import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadFile } from '@/lib/r2';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const files = await db.file.findMany({
      where: { projectId: id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = crypto.randomUUID();
    const safeName = file.name;
    const key = `${uniqueId}-${safeName}`;

    await uploadFile(key, buffer, file.type || 'application/octet-stream');

    const fileRecord = await db.file.create({
      data: {
        name: safeName,
        originalName: safeName,
        filePath: key,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        projectId: id,
      },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
