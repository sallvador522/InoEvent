/**
 * Utility to optimize image URLs on-the-fly for high performance,
 * particularly optimized for low bandwidth regions like Angola.
 */

export interface OptimizeImageOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg';
}

/**
 * Optimizes Unsplash or generic image URLs with modern query params for performance.
 * If the image is a base64 string or doesn't support query parameters, it returns the original.
 */
export function getOptimizedImageUrl(
  url: string | any,
  options: OptimizeImageOptions = {}
): string {
  if (!url) return '';
  
  // Handle complex object structures if passed
  let src: string;
  if (typeof url === 'string') {
    src = url;
  } else if (url && typeof url === 'object' && url.url) {
    src = url.url;
  } else {
    return '';
  }

  // If it's base64, data URL or local icon, do not touch
  if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('./') || src.startsWith('blob:')) {
    return src;
  }

  // Optimize Unsplash images
  if (src.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(src);
      
      // Default parameters
      const width = options.width || 800;
      const quality = options.quality || 75;
      const format = options.format || 'webp';

      // Set optimized parameters
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format'); // lets Unsplash serve best format automatically if supported, or fallback
      urlObj.searchParams.set('fm', format); // force WebP for optimal size/quality ratio
      urlObj.searchParams.set('fit', 'crop');
      
      return urlObj.toString();
    } catch (e) {
      console.warn('Failed to optimize Unsplash URL, returning original:', e);
      return src;
    }
  }

  // Return original for other/unsupported domains
  return src;
}
