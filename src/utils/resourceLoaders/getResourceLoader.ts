import { ResourceType } from '@super-protocol/dto-js';
import { IResourceLoader } from '../../types/ResourceLoader';
import { StorageProviderLoader } from './StorageProviderLoader';
import { UrlResourceLoader } from './UrlResourceLoader';

export const getResourceLoader = (resourceType: ResourceType): { new (): IResourceLoader } => {
  const loaders = [UrlResourceLoader, StorageProviderLoader];

  const Loader = loaders.find((LoaderClass) => LoaderClass.type === resourceType);

  if (!Loader) {
    throw new Error(`Loader for type ${resourceType} is not supported`);
  }

  return Loader;
};
