import { types } from "@open-rpc/meta-schema";
import { some } from "lodash";

const makeNotFoundError = (method: types.MethodObject, contentDescriptor: types.ContentDescriptorObject) => {
  const errorMessage = [
    "Content Descriptor not found in method.",
    `Method: ${JSON.stringify(method, undefined, "  ")}`,
    `ContentDescriptor: ${JSON.stringify(contentDescriptor, undefined, "  ")}`,
  ].join("\n");

  return new Error(errorMessage);
};

export const generateMethodParamId = (
  method: types.MethodObject,
  contentDescriptor: types.ContentDescriptorObject,
) => {
  if (!some(method.params, { name: contentDescriptor.name })) {
    throw makeNotFoundError(method, contentDescriptor);
  }

  const isByName = method.paramStructure === "by-name";
  const paramId = isByName ? contentDescriptor.name : method.params.indexOf(contentDescriptor);

  return `${method.name}/${paramId}`;
};

export const generateMethodResultId = (
  method: types.MethodObject,
  contentDescriptor: types.ContentDescriptorObject,
) => {
  return `${method.name}/result`;
};
