import makeParseOpenRPCDocument from "./parse-open-rpc-document";
import dereferenceDocument, { OpenRPCDocumentDereferencingError } from "./dereference-document";
import validateOpenRPCDocument, {
  OpenRPCDocumentValidationError,
} from "./validate-open-rpc-document";
import {
  generateMethodParamId,
  generateMethodResultId,
  ContentDescriptorNotFoundInMethodError,
} from "./generate-method-id";
import {
  MethodCallValidator,
  ParameterValidationError,
  MethodNotFoundError,
} from "./method-call-validator";
import fetchUrlSchema from "./get-open-rpc-document-from-url";
import { TGetOpenRPCDocument } from "./get-open-rpc-document";
import getDocumentExtendedMetaSchema from "./get-document-extended-metaschema";
import getExtendedMetaSchema from "./get-extended-metaschema";
const noop: TGetOpenRPCDocument = (schema: string) => {
  return Promise.reject(`Not Implemented, passed: ${schema}`);
};

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, noop);

export {
  dereferenceDocument,
  parseOpenRPCDocument,
  generateMethodParamId,
  generateMethodResultId,
  validateOpenRPCDocument,
  getDocumentExtendedMetaSchema,
  getExtendedMetaSchema,
  MethodNotFoundError,
  MethodCallValidator,
  ParameterValidationError,
  OpenRPCDocumentValidationError,
  OpenRPCDocumentDereferencingError,
  ContentDescriptorNotFoundInMethodError,
};
