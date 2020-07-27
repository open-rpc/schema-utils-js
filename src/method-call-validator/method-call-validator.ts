import Ajv, { ErrorObject, Ajv as IAjv } from "ajv";
import * as _ from "lodash";
import { generateMethodParamId } from "../generate-method-id";
import ParameterValidationError from "./parameter-validation-error";
import { OpenrpcDocument as OpenRPC, MethodObject, ContentDescriptorObject } from "@open-rpc/meta-schema";
import MethodNotFoundError from "./method-not-found-error";

/**
 * A class to assist in validating method calls to an OpenRPC-based service. Generated Clients,
 * Servers, and many others may want to expose the interface provided by an OpenRPC document.
 * In doing so, use this class to easily create a re-useable validator for a particular method.
 */
export default class MethodCallValidator {
  private ajvValidator: IAjv;

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

    document.methods.forEach((method: MethodObject) => {
      const params = method.params as ContentDescriptorObject[];
      if (method.params === undefined) { return; }

      params.forEach((param: ContentDescriptorObject) => {
        if (param.schema === undefined) { return; }

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
    params: any,
  ): ParameterValidationError[] | MethodNotFoundError {
    if (methodName === "rpc.discover") { return []; }
    const method = _.find(this.document.methods, { name: methodName }) as MethodObject;

    if (!method) {
      return new MethodNotFoundError(methodName, this.document, params);
    }

    return _.chain(method.params as ContentDescriptorObject[])
      .map((param: ContentDescriptorObject, index: number): ParameterValidationError | undefined => {
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

        if (input === undefined && !param.required) { return; }

        if (param.schema !== undefined) {
          const idForMethod = generateMethodParamId(method, param);
          const isValid = this.ajvValidator.validate(idForMethod, input);
          const errors = this.ajvValidator.errors as ErrorObject[];

          if (!isValid) {
            return new ParameterValidationError(id, param.schema, input, errors);
          }
        }
      })
      .compact()
      .value() as ParameterValidationError[];
  }
}
