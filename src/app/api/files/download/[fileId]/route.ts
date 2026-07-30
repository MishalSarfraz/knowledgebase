import { db } from '@/lib/db';
import { downloadFile } from '@/lib/r2';

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

    const fileBuffer = await downloadFile(fileRecord.filePath);
    const encodedFilename = encodeURIComponent(fileRecord.name);

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': fileRecord.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
