import ParameterValidationError from "./parameter-validation-error";
import { ErrorObject } from "ajv";

describe("ParameterValidationError", () => {
  const errorObj = {
    dataPath: "abc",
    keyword: "123",
    params: {},
    schemaPath: "1/2/3",
  } as ErrorObject;

  it("can be instantiated", () => {
    const error = new ParameterValidationError(1, { type: "number" }, "hey mom", [errorObj]);
    expect(error).toBeInstanceOf(ParameterValidationError);
  });
});
