export type ImageAsset = { id: string; url: string; alt?: string };
export type Post = {
  id: string;
  author: string;
  authorAvatar: string; // circular in top stripe
  title?: string;
  time: string;
  images: ImageAsset[];  // we render first image for now
};
export type User = { id: string; name: string; avatar: string }; // square in bottom stripe
