import { TypeCheck, TypeCompiler, ValueError } from '@sinclair/typebox/compiler';
import { TSchema } from '@sinclair/typebox';
import { createHash } from 'crypto';
import { Encoding, HashAlgorithm } from '@super-protocol/dto-js';

const schemaCache = new Map<string, TypeCheck<TSchema>>();

const compileSchema = <T extends TSchema>(schema: T): TypeCheck<T> => {
  const schemaHash = createHash(HashAlgorithm.SHA256)
    .update(JSON.stringify(schema))
    .digest(Encoding.hex);
  if (!schemaCache.has(schemaHash)) {
    const compiledSchema = TypeCompiler.Compile(schema);
    schemaCache.set(schemaHash, compiledSchema);
  }

  return schemaCache.get(schemaHash) as TypeCheck<T>;
};

const enhanceErrorMessage = (error: ValueError): string => {
  const { path, value, schema } = error;
  const descriptions = (schema.anyOf || [])
    .map((subSchema: TSchema) => subSchema.description)
    .filter(Boolean);
  const specificError =
    descriptions.length > 0
      ? descriptions.join('; ')
      : schema.errorMessage?.type ?? 'Invalid value';

  return `Validation error at ${path}: ${error.message}\nvalue: ${JSON.stringify(value)}\ndetailed info: ${specificError}`;
};

export const validateBySchema = <T extends TSchema>(
  data: Record<string, unknown>,
  schema: T,
  options?: { allErrors: boolean },
): {
  isValid: boolean;
  errors?: string[];
} => {
  const validator = compileSchema<T>(schema);
  const isValid = validator.Check(data);
  const allErrors = options?.allErrors ?? false;
  let errors: string[] | undefined;

  if (!isValid) {
    const errorsIterator = validator.Errors(data);
    if (allErrors) {
      errors = [...errorsIterator].map(enhanceErrorMessage);
    } else {
      const firstError = errorsIterator.First();
      errors = firstError ? [enhanceErrorMessage(firstError)] : undefined;
    }
  }

  return {
    isValid,
    ...(errors && { errors }),
  };
};
