"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeIdForMethodContentDescriptors = function (method, contentDescriptor) {
    var paramId = method.paramStructure === 'by-name' ? contentDescriptor.name : (method.params.indexOf(contentDescriptor) || method.result === contentDescriptor);
    return method.name + "/" + paramId;
};
