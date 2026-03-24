import { BRANDING_BUCKET, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, MENU_IMAGE_BUCKET } from '../constants/app';

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export function validateImageFile(file: File) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP images are supported.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
}

export function buildMenuItemImagePath(file: File) {
  return `menu-items/${crypto.randomUUID()}.${getFileExtension(file)}`;
}

export function buildBrandingImagePath(file: File) {
  return `branding/logo-${crypto.randomUUID()}.${getFileExtension(file)}`;
}

export function getPublicBucketLabel(bucket: string) {
  return bucket === MENU_IMAGE_BUCKET ? 'menu item image' : bucket === BRANDING_BUCKET ? 'business logo' : 'asset';
}
