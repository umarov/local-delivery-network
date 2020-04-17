export interface File {
  path: string;
  name: string;
}

export interface ClientDetails {
  path: string;
  files: File[];
}
