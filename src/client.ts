import { ClientFile, ClientDetails, ClientDetailsJSON } from './client-types';

export function createNewClientDetails(
  name: string,
  path: string
): ClientDetails {
  return {
    name,
    path,
    filePaths: new Map<string, string>()
  };
}

export function updateClientFileManifest(
  client: ClientDetails,
  clientFiles: ClientFile[]
): ClientDetails {
  for (const { name, path } of clientFiles) {
    const cleanedName = name.split('/').pop() || name;
    client.filePaths.set(cleanedName, path);
  }

  return client;
}

export function serializeClientDetails({
  name,
  path,
  filePaths
}: ClientDetails): ClientDetailsJSON {
  const clientObject: ClientDetailsJSON = { name, path, filePaths: [] };

  for (const [key, value] of filePaths.entries()) {
    clientObject.filePaths.push({ [key]: value });
  }

  return clientObject;
}
