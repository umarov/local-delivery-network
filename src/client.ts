import { ClientDetails, ClientDetailsJSON } from './client-types';

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
