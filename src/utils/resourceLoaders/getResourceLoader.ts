import { ResourceType } from '@super-protocol/dto-js';
import { IResourceLoader } from '../../types/ResourceLoader.js';
import { StorageProviderLoader } from './StorageProviderLoader.js';
import { UrlResourceLoader } from './UrlResourceLoader.js';

export const getResourceLoader = (resourceType: ResourceType): { new (): IResourceLoader } => {
  const loaders = [UrlResourceLoader, StorageProviderLoader];

  const Loader = loaders.find((LoaderClass) => LoaderClass.type === resourceType);

  if (!Loader) {
    throw new Error(`Loader for type ${resourceType} is not supported`);
  }

  return Loader;
};
