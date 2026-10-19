import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src: string };

/** Loads private database files with the normal Authorization header. */
export const AuthenticatedImage: React.FC<Props> = ({ src, ...props }) => {
  const [resolved, setResolved] = useState(() => src.includes('/api/files/') ? '' : src);
  useEffect(() => {
    if (!src.includes('/api/files/')) {
      setResolved(src);
      return;
    }
    let objectUrl = '';
    let active = true;
    setResolved('');
    void apiClient.get<Blob>(src, { responseType: 'blob' }).then(({ data }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(data);
      setResolved(objectUrl);
    }).catch(() => setResolved(''));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);
  return resolved ? <img {...props} src={resolved} /> : null;
};
