import { MethodObject, ExamplePairingObject, ContentDescriptorObject, OpenrpcDocument } from "@open-rpc/meta-schema";

const getExamplesFromMethod = (method: MethodObject): ExamplePairingObject[] => {
  const examples: ExamplePairingObject[] = [];

  if (method.params) {
    (method.params as ContentDescriptorObject[]).forEach((param, index: number) => {
      if (param.schema && typeof param.schema !== "boolean" && param.schema.examples && param.schema.examples.length > 0) {
        param.schema.examples.forEach((ex: any, i: number) => {
          if (!examples[i]) {
            examples.push({
              name: "",
              params: [
                {
                  name: param.name,
                  value: ex,
                },
              ],
              result: {
                name: "",
                value: null,
              },
            });
          } else {
            examples[i].params.push({
              name: param.name,
              value: ex,
            });
          }
        });
      }
    });
  }
  const methodResult = method.result as ContentDescriptorObject;
  if (methodResult) {
    if (methodResult && methodResult.schema && typeof methodResult.schema !== "boolean" && methodResult.schema.examples && methodResult.schema.examples.length > 0) {
      methodResult.schema.examples.forEach((ex: any, i: number) => {
        if (!examples[i]) {
          examples.push({
            name: "",
            params: [],
            result: {
              name: methodResult.name,
              value: ex,
            },
          });
        } else {
          examples[i].result = {
            name: methodResult.name,
            value: ex,
          };
        }
      });
    }
  }
  return examples;
};

const fallbackExamples = (openrpcDocument: OpenrpcDocument): OpenrpcDocument => {
  for (const method of openrpcDocument.methods) {
    if (!method.examples) {
      method.examples = method.examples || getExamplesFromMethod(method);
    }
  }

  return openrpcDocument;
}


export default fallbackExamples;
