import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { generateMethodParamId } from "../generate-method-id";
import ParameterValidationError from "./parameter-validation-error";
import {
  OpenrpcDocument as OpenRPC,
  MethodObject,
  ContentDescriptorObject,
  MethodOrReference,
} from "@open-rpc/meta-schema";
import MethodNotFoundError from "./method-not-found-error";
import { find, compact } from "../helper-functions";
import MethodRefUnexpectedError from "./method-ref-unexpected-error";

/**
 * A class to assist in validating method calls to an OpenRPC-based service. Generated Clients,
 * Servers, and many others may want to expose the interface provided by an OpenRPC document.
 * In doing so, use this class to easily create a re-useable validator for a particular method.
 */
export default class MethodCallValidator {
  private ajvValidator: Ajv;

  /**
   * @param document The OpenRPC document containing the methods whose calls we want validated.
   *
   * @example
   * ```typescript
   *
   * import { petstore } from "@open-rpc/examples";
   * const petStoreMethodCallValidator = new MethodCallValidator(petstore);
   * // Go on and use it!
   * ```
   *
   */
  constructor(private document: OpenRPC) {
    this.ajvValidator = new Ajv();
    addFormats(this.ajvValidator);

    // Validate that the methods are dereferenced
    document.methods.forEach((method: MethodOrReference) => {
      if (method.$ref) throw new MethodRefUnexpectedError(method.$ref, document);
    });

    (document.methods as MethodObject[]).forEach((method: MethodObject) => {
      const params = method.params as ContentDescriptorObject[];

      params.forEach((param: ContentDescriptorObject) => {
        if (param.schema === undefined) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.ajvValidator.addSchema(param.schema as any, generateMethodParamId(method, param));
      });
    });
  }

  /**
   * Validates a particular method call against the OpenRPC definition for the method.
   *
   * @param methodName the name of the method in the OpenRPC Document.
   * @param params the param values that you want validated.
   *
   * @returns an array of parameter validation errors, or if there are none, an empty array.
   * if the method name is invalid, a [[MethodNotFoundError]] is returned.
   *
   * @example
   * ```typescript
   *
   * import { petstore } from "@open-rpc/examples";
   * const petStoreMethodCallValidator = new MethodCallValidator(petstore);
   * const errors = petStoreMethodCallValidator.validate("list_pets", []);
   * // errors.length === 0
   * ```
   *
   */
  public validate(
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    params: any
  ): ParameterValidationError[] | MethodNotFoundError {
    if (methodName === "rpc.discover") {
      return [];
    }
    const method = find(this.document.methods, (o: MethodObject) => {
      return o.name == methodName;
    }) as MethodObject;

    if (!method) {
      return new MethodNotFoundError(methodName, this.document, params);
    }

    const paramMap = method.params as ContentDescriptorObject[];
    return compact(
      paramMap.map(
        (param: ContentDescriptorObject, index: number): ParameterValidationError | undefined => {
          let id: string | number;
          if (method.paramStructure === "by-position") {
            id = index;
          } else if (method.paramStructure === "by-name") {
            id = param.name;
          } else {
            if (params[index] !== undefined) {
              id = index;
            } else {
              id = param.name;
            }
          }
          const input = params[id];

          if (input === undefined && !param.required) {
            return;
          }

          if (param.schema !== undefined) {
            const idForMethod = generateMethodParamId(method, param);
            const isValid = this.ajvValidator.validate(idForMethod, input);
            const errors = this.ajvValidator.errors as ErrorObject[];

            if (!isValid) {
              return new ParameterValidationError(id, param.schema, input, errors);
            }
          }
        }
      )
    ) as ParameterValidationError[];
  }
}
