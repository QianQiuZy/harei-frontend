export const buildCaptaingiftImageUrl = (path: string) => {
  const params = new URLSearchParams({ path });
  return `/api/captaingift-image?${params.toString()}`;
};
