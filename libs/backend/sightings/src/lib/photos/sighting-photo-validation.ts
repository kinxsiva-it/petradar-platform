import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';

export interface UploadedSightingPhotoFile {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
  size: number;
}

export interface ValidatedSightingPhoto {
  buffer: Buffer;
  extension: 'jpg' | 'png' | 'webp';
  fileSizeBytes: number;
  mimeType: AllowedSightingPhotoMimeType;
}

export type AllowedSightingPhotoMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export const allowedSightingPhotoMimeTypes: readonly AllowedSightingPhotoMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const maxSightingPhotoBytes = 8 * 1024 * 1024;
export const maxSightingPhotosPerRequest = 5;
export const maxSightingPhotosPerSighting = 5;

@Injectable()
export class SightingPhotoValidationService {
  validate(files: readonly UploadedSightingPhotoFile[]): ValidatedSightingPhoto[] {
    if (files.length === 0) {
      throw new BadRequestException('Choose at least one photo to upload.');
    }

    if (files.length > maxSightingPhotosPerRequest) {
      throw new BadRequestException('Upload at most 5 photos at a time.');
    }

    return files.map((file) => this.validateOne(file));
  }

  private validateOne(file: UploadedSightingPhotoFile): ValidatedSightingPhoto {
    if (file.size <= 0 || file.buffer.length === 0) {
      throw new BadRequestException('Empty image files are not accepted.');
    }

    if (file.size > maxSightingPhotoBytes || file.buffer.length > maxSightingPhotoBytes) {
      throw new PayloadTooLargeException('Each photo must be 8 MB or smaller.');
    }

    if (!isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, or WebP images are accepted.');
    }

    const signature = detectImageSignature(file.buffer);
    if (!signature) {
      throw new BadRequestException('The image file appears to be corrupt or unsupported.');
    }

    if (signature.mimeType !== file.mimetype) {
      throw new BadRequestException('The image content does not match its MIME type.');
    }

    const sanitized = stripPublicImageMetadata(file.buffer, signature.mimeType);
    return {
      buffer: sanitized,
      extension: signature.extension,
      fileSizeBytes: sanitized.length,
      mimeType: signature.mimeType,
    };
  }
}

function isAllowedMimeType(value: string): value is AllowedSightingPhotoMimeType {
  return allowedSightingPhotoMimeTypes.includes(value as AllowedSightingPhotoMimeType);
}

function detectImageSignature(
  buffer: Buffer,
): { extension: 'jpg' | 'png' | 'webp'; mimeType: AllowedSightingPhotoMimeType } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: 'png', mimeType: 'image/png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: 'webp', mimeType: 'image/webp' };
  }

  return null;
}

function stripPublicImageMetadata(
  buffer: Buffer,
  mimeType: AllowedSightingPhotoMimeType,
): Buffer {
  if (mimeType === 'image/jpeg') {
    return stripJpegMetadata(buffer);
  }

  if (mimeType === 'image/png') {
    return stripPngMetadata(buffer);
  }

  return stripWebpMetadata(buffer);
}

function stripJpegMetadata(buffer: Buffer): Buffer {
  const chunks: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    if (marker === undefined || marker === 0xda || marker === 0xd9) {
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) {
      return buffer;
    }

    const segment = buffer.subarray(offset, offset + 2 + length);
    if (marker !== 0xe1 && marker !== 0xed) {
      chunks.push(segment);
    }
    offset += 2 + length;
  }

  chunks.push(buffer.subarray(offset));
  return Buffer.concat(chunks);
}

function stripPngMetadata(buffer: Buffer): Buffer {
  const signature = buffer.subarray(0, 8);
  const chunks: Buffer[] = [signature];
  let offset = 8;
  const metadataChunks = new Set(['eXIf', 'iTXt', 'tEXt', 'zTXt']);

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const end = offset + 12 + length;
    if (end > buffer.length) {
      return buffer;
    }

    if (!metadataChunks.has(type)) {
      chunks.push(buffer.subarray(offset, end));
    }
    offset = end;

    if (type === 'IEND') {
      break;
    }
  }

  return Buffer.concat(chunks);
}

function stripWebpMetadata(buffer: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let offset = 12;
  let payloadLength = 0;

  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const length = buffer.readUInt32LE(offset + 4);
    const paddedLength = length + (length % 2);
    const end = offset + 8 + paddedLength;
    if (end > buffer.length) {
      return buffer;
    }

    if (type !== 'EXIF' && type !== 'XMP ') {
      const chunk = buffer.subarray(offset, end);
      chunks.push(chunk);
      payloadLength += chunk.length;
    }
    offset = end;
  }

  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(4 + payloadLength, 4);
  header.write('WEBP', 8, 'ascii');

  return Buffer.concat([header, ...chunks]);
}

