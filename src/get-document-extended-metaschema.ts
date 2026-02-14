import { OpenrpcDocument } from "./types";
import applyExtensionSpec from "./apply-extension-spec";
import getExtendedMetaSchema from "./get-extended-metaschema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getDocumentExtendedMetaSchema(document: OpenrpcDocument): any {
  const extendedMetaSchema = getExtendedMetaSchema();
  const extendedDocument = applyExtensionSpec(document, extendedMetaSchema);
  return extendedDocument;
}
