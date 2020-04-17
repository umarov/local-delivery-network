export function determineMimeType(filePath: string): string | void {
  const fileFormat = filePath.split('.').pop();

  switch (fileFormat) {
    case 'js':
      return 'text/javascript';

    case 'css':
      return 'text/css';

    case 'json':
      return 'application/json';

    case 'html':
      return 'text/html';

    case 'png':
      return 'image/png';

    case 'svg':
      return 'image/svg+xml';

    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';

    case 'ico':
      return 'image/x-icon';

    case 'bmp':
      return 'image/bmp';

    case 'gif':
      return 'image/gif';

    case 'webp':
      return 'image/webp';

    case 'mp3':
      return 'audio/mp3';

    default:
      break;
  }
}
