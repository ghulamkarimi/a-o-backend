export const getPublicIdFromUrl = (url) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    const publicId = fileName.split('.')[0]; 
    return publicId;
  };
  