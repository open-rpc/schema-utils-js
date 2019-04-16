import typescript from "./typescript";
import rust from "./rust";
import { IGenerator, IContentDescriptorTyping, IMethodTypingsMap } from "./generator-interface";
import { OpenRPC, MethodObject, ContentDescriptorObject } from "@open-rpc/meta-schema";
import _ from "lodash";

interface IGenerators {
  typescript: IGenerator;
  rust: IGenerator;
  [key: string]: IGenerator;
}

type TLanguages = "typescript" | "rust";
const languages: TLanguages[] = ["typescript", "rust"];

const generators: IGenerators = {
  rust,
  typescript,
};

interface ITypingMapByLanguage {
  [language: string]: IMethodTypingsMap;
}

export default class MethodTypings {
  private typingMapByLanguage: ITypingMapByLanguage = {};

  constructor(private openrpcDocument: OpenRPC) { }

  public async generateTypings() {
    await Promise.all(languages.map(async (language) => {
      this.typingMapByLanguage[language] = await generators[language]
        .getMethodTypingsMap(this.openrpcDocument);
    }));

    return true;
  }

  public getAllUniqueTypings(language: TLanguages): string {
    if (Object.keys(this.typingMapByLanguage).length === 0) {
      throw new Error("typings have not yet been generated. Please run generateTypings first.");
    }

    return _.chain(this.typingMapByLanguage[language])
      .values()
      .uniqBy("typeName")
      .map("typing")
      .value()
      .join("");
  }

  public getFunctionSignature(method: MethodObject, language: TLanguages, standalone?: boolean) {
    if (Object.keys(this.typingMapByLanguage).length === 0) {
      throw new Error("typings have not yet been generated. Please run generateTypings first.");
    }

    const sig = generators[language]
      .getFunctionSignature(method, this.typingMapByLanguage[language]);

    if (standalone) {
      return sig.replace("public", "export default function");
    } else {
      return sig;
    }
  }
}
