import makeParseOpenRPCDocument from "./parse-open-rpc-document";
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

const noop: TGetOpenRPCDocument = (schema: string) => {
  return Promise.reject(`Not Implemented, passed: ${schema}`);
};

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, noop);

export {
  parseOpenRPCDocument,
  generateMethodParamId,
  generateMethodResultId,
  validateOpenRPCDocument,
  MethodNotFoundError,
  MethodCallValidator,
  ParameterValidationError,
  OpenRPCDocumentValidationError,
  ContentDescriptorNotFoundInMethodError,
};
