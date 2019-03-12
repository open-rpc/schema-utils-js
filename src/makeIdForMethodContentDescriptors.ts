export const makeIdForMethodContentDescriptors = (method, contentDescriptor) => {
  const paramId = method.paramStructure === 'by-name' ? contentDescriptor.name : (method.params.indexOf(contentDescriptor) || method.result === contentDescriptor);
  return `${method.name}/${paramId}`;
};
