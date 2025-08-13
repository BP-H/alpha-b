export interface Post {
  id: number | string;
  author?: string;
  title?: string;
  image?: string;
  
  // Add these two lines to fix the build:
  space?: string;
  avatar?: string;
}
