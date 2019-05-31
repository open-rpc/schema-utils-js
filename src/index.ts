import makeParseOpenRPCDocument, { OpenRPCDocumentDereferencingError } from "./parse-open-rpc-document";
import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import {
  generateMethodParamId,
  generateMethodResultId,
  ContentDescriptorNotFoundInMethodError,
} from "./generate-method-id";
import { MethodCallValidator, ParameterValidationError } from "./method-call-validator";
import readSchemaFromFile from "./get-open-rpc-document-from-file";
import fetchUrlSchema from "./get-open-rpc-document-from-url";

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, readSchemaFromFile);

export {
  parseOpenRPCDocument,
  generateMethodParamId,
  generateMethodResultId,
  validateOpenRPCDocument,
  MethodCallValidator,
  ParameterValidationError,
  OpenRPCDocumentValidationError,
  OpenRPCDocumentDereferencingError,
  ContentDescriptorNotFoundInMethodError,
};
