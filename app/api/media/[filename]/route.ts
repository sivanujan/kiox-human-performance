import { readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'public', 'uploads', 'gallery', filename);

  if (!existsSync(filePath)) {
    console.error('[/api/media] File not found:', filePath);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  const contentType = mimeTypes[ext] ?? 'application/octet-stream';

  const rangeHeader = request.headers.get('range');

  try {
    if (rangeHeader && contentType.startsWith('video/')) {
      // Parse Range: "bytes=start-end"
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        return new NextResponse('Invalid Range', { status: 416 });
      }

      const start = match[1] ? parseInt(match[1], 10) : 0;
      // If no end specified (e.g. "bytes=0-"), serve the entire remaining file.
      // This is critical: the MP4 moov atom may be at the END of the file
      // (non-faststart). If we only return the first 1MB, Chrome's FFmpeg
      // can't find the moov atom and throws DEMUXER_ERROR_COULD_NOT_OPEN.
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start > end || start >= fileSize) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const safeEnd = Math.min(end, fileSize - 1);
      const chunkSize = safeEnd - start + 1;

      // Read only the requested byte range
      const fileBuffer = readFileSync(filePath);
      const chunk = fileBuffer.slice(start, safeEnd + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${safeEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Full file (images or first non-Range video request)
    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[/api/media] Error reading file:', err);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
