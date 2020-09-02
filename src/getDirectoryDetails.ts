import fs from 'fs';
import path from 'path';

export type subDirFolder = { [key: string]: subDir };
export type subDir = (string | subDirFolder)[];

export function getAppPath(
  app: string,
  baseDir: string,
  aggregatedMode: boolean
): string {
  return aggregatedMode
    ? path.join(baseDir, 'dist', app)
    : path.join(baseDir, app, 'dist');
}

export async function getDirectoryDetails(
  currentPath: string,
  dir: fs.Dir
): Promise<subDir> {
  const subDirs: subDir = [];
  for await (const dirent of dir) {
    if (dirent.isDirectory()) {
      const subdirPath = path.join(currentPath, dirent.name);
      const subdir = await fs.promises.opendir(subdirPath);
      subDirs.push({
        [dirent.name]: await getDirectoryDetails(subdirPath, subdir)
      });
    } else {
      subDirs.push(dirent.name);
    }
  }

  return subDirs;
}
