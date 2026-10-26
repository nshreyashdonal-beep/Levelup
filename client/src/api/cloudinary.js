// Direct browser upload helper for lecture videos.
// The file goes from the browser to Cloudinary; the LevelUp server never
// receives or stores the video bytes.

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function getUploadConfig() {
  if (!cloudName || !apiKey || !uploadPreset) {
    throw new Error(
      'Cloudinary upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, and VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  return { cloudName, apiKey, uploadPreset };
}

export function uploadLectureVideo(file, onProgress = () => {}, onAbortRef = null) {
  if (!(file instanceof File)) {
    return Promise.reject(new Error('Please choose a video file.'));
  }

  if (!file.type.startsWith('video/')) {
    return Promise.reject(new Error('The selected file must be a video.'));
  }

  const {
    cloudName: configuredCloudName,
    apiKey: configuredApiKey,
    uploadPreset: configuredPreset,
  } = getUploadConfig();

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('api_key', configuredApiKey);
    formData.append('upload_preset', configuredPreset);

    // Register abort handle if caller provided a ref or callback
    if (onAbortRef && typeof onAbortRef === 'object') {
      onAbortRef.current = () => {
        try {
          request.abort();
        } catch {}
      };
    } else if (typeof onAbortRef === 'function') {
      onAbortRef(() => {
        try {
          request.abort();
        } catch {}
      });
    }

    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${configuredCloudName}/video/upload`
    );

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener('load', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }

      let data;

      try {
        data = JSON.parse(request.responseText);
      } catch {
        reject(new Error('Cloudinary returned an unreadable response.'));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(data.error?.message || 'Cloudinary upload failed.'));
        return;
      }

      if (!data.secure_url) {
        reject(new Error('Cloudinary did not return a secure video URL.'));
        return;
      }

      onProgress(100);
      resolve({
        secureUrl: data.secure_url,
        publicId: data.public_id,
        resourceType: data.resource_type,
        duration: data.duration,
      });
    });

    request.addEventListener('error', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }
      reject(new Error('Could not reach Cloudinary.'));
    });

    request.addEventListener('abort', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }
      const cancelError = new Error('Upload cancelled.');
      cancelError.isCancelled = true;
      reject(cancelError);
    });

    request.send(formData);
  });
}

export function uploadProfileImage(file, onProgress = () => {}, onAbortRef = null) {
  if (!(file instanceof File)) {
    return Promise.reject(new Error('Please choose an image file.'));
  }

  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('The selected file must be an image (PNG, JPG, WEBP, or GIF).'));
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    return Promise.reject(new Error('Image must be smaller than 5 MB.'));
  }

  const {
    cloudName: configuredCloudName,
    apiKey: configuredApiKey,
    uploadPreset: configuredPreset,
  } = getUploadConfig();

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('api_key', configuredApiKey);
    formData.append('upload_preset', configuredPreset);

    if (onAbortRef && typeof onAbortRef === 'object') {
      onAbortRef.current = () => {
        try {
          request.abort();
        } catch {}
      };
    } else if (typeof onAbortRef === 'function') {
      onAbortRef(() => {
        try {
          request.abort();
        } catch {}
      });
    }

    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${configuredCloudName}/image/upload`
    );

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener('load', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }

      let data;
      try {
        data = JSON.parse(request.responseText);
      } catch {
        reject(new Error('Cloudinary returned an unreadable response.'));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(data.error?.message || 'Cloudinary image upload failed.'));
        return;
      }

      if (!data.secure_url) {
        reject(new Error('Cloudinary did not return a secure image URL.'));
        return;
      }

      onProgress(100);
      resolve({
        secureUrl: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        width: data.width,
        height: data.height,
      });
    });

    request.addEventListener('error', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }
      reject(new Error('Could not reach Cloudinary. Please check your internet connection.'));
    });

    request.addEventListener('abort', () => {
      if (onAbortRef && typeof onAbortRef === 'object') {
        onAbortRef.current = null;
      }
      const cancelError = new Error('Upload cancelled.');
      cancelError.isCancelled = true;
      reject(cancelError);
    });

    request.send(formData);
  });
}

