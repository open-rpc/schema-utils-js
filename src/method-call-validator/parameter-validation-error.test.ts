import ParameterValidationError from "./parameter-validation-error";
import { ErrorObject } from "ajv";

describe("ParameterValidationError", () => {
  const errorObj = {
    instancePath: "abc",
    keyword: "123",
    params: {},
    schemaPath: "1/2/3",
    message: "test error",
  } as ErrorObject;

  it("can be instantiated", () => {
    const error = new ParameterValidationError(1, { type: "number" }, "hey mom", [errorObj]);
    expect(error).toBeInstanceOf(ParameterValidationError);
  });

  it("works when passed an object key instead of array index", () => {
    const error = new ParameterValidationError("foo", { type: "number" }, "hey mom", [errorObj]);
    expect(error).toBeInstanceOf(ParameterValidationError);
  });
});
