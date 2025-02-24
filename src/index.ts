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
import readSchemaFromFile from "./get-open-rpc-document-from-file";
import fetchUrlSchema from "./get-open-rpc-document-from-url";
import getExtendedMetaSchema from "./get-extended-metaschema";
import getDocumentExtendedMetaSchema from "./get-document-extended-metaschema";

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, readSchemaFromFile);

export {
  dereferenceDocument,
  parseOpenRPCDocument,
  generateMethodParamId,
  generateMethodResultId,
  validateOpenRPCDocument,
  getExtendedMetaSchema,
  getDocumentExtendedMetaSchema,
  MethodCallValidator,
  ParameterValidationError,
  MethodNotFoundError,
  OpenRPCDocumentValidationError,
  OpenRPCDocumentDereferencingError,
  ContentDescriptorNotFoundInMethodError,
};
