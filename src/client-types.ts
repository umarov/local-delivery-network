export interface ClientFile {
  path: string;
  name: string;
}

export interface ClientDetails {
  name: string;
  path: string;
  filePaths: Map<string, string>;
}

type filePaths = { [key: string]: string }[];
export interface ClientDetailsJSON {
  name: string;
  path: string;
  filePaths: filePaths;
}
