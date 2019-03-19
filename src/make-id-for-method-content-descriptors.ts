import { types } from "@open-rpc/meta-schema";

const makeNotFoundError = (method: types.MethodObject, contentDescriptor: types.ContentDescriptorObject) => {
  const errorMessage = [
    "Content Descriptor not found in method.",
    `Method: ${JSON.stringify(method, undefined, "  ")}`,
    `ContentDescriptor: ${JSON.stringify(contentDescriptor, undefined, "  ")}`,
  ].join("\n");

  return new Error(errorMessage);
};

export const makeIdForMethodContentDescriptors = (
  method: types.MethodObject,
  contentDescriptor: types.ContentDescriptorObject,
) => {
  if (method.params === undefined) { throw makeNotFoundError(method, contentDescriptor); }

  let paramId;
  if (method.paramStructure === "by-name") {
    paramId = contentDescriptor.name;
  } else {
    const indexOfContentDescriptor = method.params.indexOf(contentDescriptor);

    if (indexOfContentDescriptor !== -1) {
      paramId = indexOfContentDescriptor;
    } else {
      throw makeNotFoundError(method, contentDescriptor);
    }
  }

  return `${method.name}/${paramId}`;
};
