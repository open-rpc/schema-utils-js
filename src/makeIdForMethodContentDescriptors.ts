export const makeIdForMethodContentDescriptors = (method: any, contentDescriptor: any) => {
  const paramId = method.paramStructure === "by-name" ? contentDescriptor.name : (method.params.indexOf(contentDescriptor) || method.result === contentDescriptor);
  return `${method.name}/${paramId}`;
};
