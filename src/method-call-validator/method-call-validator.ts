import Ajv, { ErrorObject, Ajv as IAjv } from "ajv";
import * as _ from "lodash";
import { generateMethodParamId } from "../generate-method-id";
import MethodCallParameterValidationError from "./parameter-validation-error";
import { OpenRPC, MethodObject, ContentDescriptorObject } from "@open-rpc/meta-schema";

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

      params.forEach((param: ContentDescriptorObject, i: number) => {
        if (param.schema === undefined) { return; }

        this.ajvValidator.addSchema(param.schema, generateMethodParamId(method, param));
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
  public validate(methodName: string, params: any[]): MethodCallParameterValidationError[] {
    const method = _.find(this.document.methods, { name: methodName }) as MethodObject;

    if (method.params === undefined) {
      return [];
    }

    return _.chain(method.params as ContentDescriptorObject[])
      .map((param: ContentDescriptorObject, index: number): MethodCallParameterValidationError | undefined => {
        if (param.schema === undefined) { return; }
        if (!params[index] && !param.required) { return; }

        const idForMethod = generateMethodParamId(method, param);
        const isValid = this.ajvValidator.validate(idForMethod, params[index]);
        const errors = this.ajvValidator.errors as ErrorObject[];

        if (!isValid) {
          return new MethodCallParameterValidationError(index, param.schema, params[index], errors);
        }
      })
      .compact()
      .value() as MethodCallParameterValidationError[];
  }
}
