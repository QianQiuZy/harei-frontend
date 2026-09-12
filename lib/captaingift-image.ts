export const buildCaptaingiftImageUrl = (path: string) => {
  const filename = path.split(/[\\/]/).pop() ?? '';
  return `/api/captaingift-image/${encodeURIComponent(filename)}`;
};
