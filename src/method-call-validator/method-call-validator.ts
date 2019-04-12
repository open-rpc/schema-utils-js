import Ajv, { ErrorObject } from "ajv";
import * as _ from "lodash";
import { generateMethodParamId } from "../generate-method-id";
import { types } from "@open-rpc/meta-schema";
import ParameterValidationError from "./parameter-validation-error";

/**
 * A class to assist in validating method calls to an OpenRPC-based service. Generated Clients,
 * Servers, and many others may want to expose the interface provided by an OpenRPC document.
 * In doing so, use this class to easily create a re-useable validator for a particular method.
 */
export default class MethodCallValidator {
  private ajvValidator: Ajv.Ajv;

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
  constructor(private document: types.OpenRPC) {
    this.ajvValidator = new Ajv();

    document.methods.forEach((method: types.MethodObject) => {
      const params = method.params as types.ContentDescriptorObject[];
      if (method.params === undefined) { return; }

      params.forEach((param: types.ContentDescriptorObject, i: number) => {
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
  public validate(methodName: string, params: any[]): ParameterValidationError[] {
    const method = _.find(this.document.methods, { name: methodName }) as types.MethodObject;

    if (method.params === undefined) {
      return [];
    }

    return _.chain(method.params as types.ContentDescriptorObject[])
      .map((param: types.ContentDescriptorObject, index: number): ParameterValidationError | undefined => {
        if (param.schema === undefined) { return; }

        const idForMethod = generateMethodParamId(method, param);
        const isValid = this.ajvValidator.validate(idForMethod, params[index]);
        const errors = this.ajvValidator.errors as ErrorObject[];

        if (!isValid) {
          return new ParameterValidationError(index, param.schema, params[index], errors);
        }
      })
      .compact()
      .value();
  }
}
