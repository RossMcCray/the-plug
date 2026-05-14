export interface HookAnalysis {
  id: string;
  niche: string;
  mainHook: string;
  whyItWorks: string;
  variations: string[];
  pinterestQueries: string[];
  createdAt: string;
}

export interface SlideSet {
  hook: string;
  problem: string;
  value1: string;
  value2: string;
  value3: string;
  cta: string;
}

export interface UploadedImage {
  data: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  name: string;
}
