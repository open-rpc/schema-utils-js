export const makeIdForMethodContentDescriptors = (method: any, contentDescriptor: any) => {
  const hasContentDescriptor = method.params.indexOf(contentDescriptor);

  let paramId;
  if (method.paramStructure === "by-name") {
    paramId = contentDescriptor.name;
  } else {
    paramId = hasContentDescriptor || method.result === contentDescriptor;
  }

  return `${method.name}/${paramId}`;
};
