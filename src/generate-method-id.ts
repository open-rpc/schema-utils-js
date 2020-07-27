
import { MethodObject, ContentDescriptorObject } from "@open-rpc/meta-schema";
import { findIndex } from "./helper-functions";

/**
 * Provides an error interface for handling when we are unable to find a contentDescriptor in a methodObject
 * when it is expected.
 *
 * @category Errors
 *
 */
export class ContentDescriptorNotFoundInMethodError implements Error {
  public name = "OpenRPCDocumentDereferencingError";
  public message: string;

  /**
   * @param method OpenRPC Method which was used for the lookup
   * @param contentDescriptor OpenRPC Content Descriptor that was expected to be in the method param.
   */
  constructor(public method: MethodObject, public contentDescriptor: ContentDescriptorObject) {
    this.message = [
      "Content Descriptor not found in method.",
      `Method: ${JSON.stringify(method, undefined, "  ")}`,
      `ContentDescriptor: ${JSON.stringify(contentDescriptor, undefined, "  ")}`,
    ].join("\n");
  }
}

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
 * @throws [[ContentDescriptorNotFoundInMethodError]]
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
 * @category GenerateID
 *
 */
export function generateMethodParamId(
  method: MethodObject,
  contentDescriptor: ContentDescriptorObject,
): string {
  const pos = findIndex(method.params, (o: any) => { return o.name == contentDescriptor.name });

  if (pos === -1) {
    throw new ContentDescriptorNotFoundInMethodError(method, contentDescriptor);
  }

  let paramId: string;
  if (method.paramStructure === "by-position") {
    paramId = pos.toString();
  } else if (method.paramStructure === "by-name") {
    const paramCD = method.params[pos] as ContentDescriptorObject;
    paramId = paramCD.name;
  } else {
    const paramCD = method.params[pos] as ContentDescriptorObject;
    paramId = `${paramCD.name}/${pos.toString()}`;
  }

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
 * @throws [[ContentDescriptorNotFoundInMethodError]]
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
 * @category GenerateID
 *
 */
export function generateMethodResultId(
  method: MethodObject,
  contentDescriptor: ContentDescriptorObject,
): string {
  const result = method.result as ContentDescriptorObject;
  if (result.name !== contentDescriptor.name) {
    throw new ContentDescriptorNotFoundInMethodError(method, contentDescriptor);
  }

  return `${method.name}/result`;
}
