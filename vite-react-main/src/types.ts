export interface Post {
  id: string | number;
  author?: string;
  title?: string;
  image?: string;
  space?: string;
  avatar?: string; // The correct property is 'avatar'
}
