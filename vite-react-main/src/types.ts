export type ImageAsset = {
  id: string;
  url: string;
  alt?: string;
};

export type Post = {
  id: string;
  author: string;
  authorAvatar: string; // avatar for the poster (top-left of card)
  title?: string;
  subtitle?: string;
  time: string;
  images: ImageAsset[]; // use images[], not image
};

export type User = {
  id: string;
  name: string;
  avatar: string;
};
