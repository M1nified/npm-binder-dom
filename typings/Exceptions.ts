abstract class BinderException {
  code: number;
  message: string;
  get name(){
    return this.constructor.name;
  }
  constructor(code?: number | string, message?: string) {
    if (typeof code === "string") {
      this.message = code;
    } else {
      this.code = code;
      this.message = message;
    }
  }
  toString() {
    return this.name + ", code: " + this.code + ". Message: \"" + this.message + "\"";
  }
}

class ApplyElementNotSupportedBinderException extends BinderException {}