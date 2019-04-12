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

/**
 * Create a unique identifier for a parameter within a given method.
 * This is typically used to create hashmap keys for method to parameter mappings.
 *
 * @param method The OpenRPC Method which encloses the content descriptor
 * @param contentDescriptor The OpenRPC Content Descriptor that is a param in the method
 *
 * @returns an ID for the param/method combo.
 * It follows the format `{method.name}/{indexWithinParams}|{contentDescriptor.name}` where:
 *   1. if the method's parameter structure is "by-name", the format returned uses the contentDescriptor.name
 *   1. otherwise, the return value will use the params index in the list of params.
 *
 * @example
 * ```typescript
 *
 * const { generateMethodParamId }
 * const methodObject = {
 *   name: "foo",
 *   params: [{
 *     name: "fooParam",
 *     schema: { type: "integer" }
 *   }],
 *   result: {}
 * };
 * const paramId = generateMethodParamId(methodObject, methodObject.params[0]);
 * console.log(paramId);
 * // outputs:
 * // "foo/0/fooParam"
 * ```
 *
 */
export function generateMethodParamId(
  method: types.MethodObject,
  contentDescriptor: types.ContentDescriptorObject,
): string {
  if (!some(method.params, { name: contentDescriptor.name })) {
    throw makeNotFoundError(method, contentDescriptor);
  }

  const isByName = method.paramStructure === "by-name";
  const paramId = isByName ? contentDescriptor.name : method.params.indexOf(contentDescriptor);

  return `${method.name}/${paramId}`;
}

/**
 * Create a unique identifier for a result within a given method.
 * This is typically used to create hashmap keys for method to result mappings.
 *
 * @param method The OpenRPC Method which encloses the content descriptor
 * @param contentDescriptor The OpenRPC Content Descriptor (either a method param or the result).
 *
 * @returns an ID for the result/method combo.
 * It follows the format `{method.name}/result`.
 *
 * @example
 * ```typescript
 *
 * const { generateMethodResultId }
 * const methodObject = {
 *   name: "foo",
 *   params: [],
 *   result: {
 *     name: "fooResult",
 *     schema: { type: "string" }
 *   }
 * };
 * const resultId = generateMethodResultId(methodObject, methodObject.result);
 * console.log(paramId);
 * // outputs:
 * // "foo/result"
 * ```
 *
 */
export function generateMethodResultId(
  method: types.MethodObject,
  contentDescriptor: types.ContentDescriptorObject,
): string {
  return `${method.name}/result`;
}
