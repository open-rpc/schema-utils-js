import makeParseOpenRPCDocument, { OpenRPCDocumentDereferencingError } from "./parse-open-rpc-document";
import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import {
  generateMethodParamId,
  generateMethodResultId,
  ContentDescriptorNotFoundInMethodError,
} from "./generate-method-id";
import { MethodCallValidator, ParameterValidationError } from "./method-call-validator";
import fetchUrlSchema from "./get-open-rpc-document-from-url";
import { TGetOpenRPCDocument } from "./get-open-rpc-document";

const noop: TGetOpenRPCDocument = (schema: string) => {
  return Promise.reject("Not Implemented");
};

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, noop);

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