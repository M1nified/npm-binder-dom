class Parser {
  protected _settings: BinderSettings;
  constructor(settings: BinderSettings) {
    this._settings = settings;
  }
  parse(element: Element) {
    if (element.hasAttribute(this._settings.attrRepeat)) {

    } else if (element.hasAttribute(this._settings.attrModel)) {

    } else if (element.hasAttribute(this._settings.attrValue)) {

    }
  }
}

abstract class ParserReal {

  public nextParser: ParserReal = null;

  protected static _instance: ParserReal;
  protected _settings: BinderSettings;
  protected constructor(settings: BinderSettings) {
    this._settings = settings;
  }

  static getInstance(settings?: BinderSettings): ParserReal {
    if (!ParserReal._instance) {
      if (typeof settings === 'undefined') {
        return null;
      }
      ParserReal._instance = new this(settings);
    }
    return ParserReal._instance;
  }

  next(): ParserReal {
    return this.nextParser;
  }

  abstract parse(element: Element): void;
}

class ParserRealRepeat extends ParserReal {
  parse(element: Element) {

  }
}

class ParserRealValue extends ParserReal {
  parse(element: Element) {

  }
}

class AttrParser {
  static parseRepeat(attrValue: string) {
    let result: RegExpExecArray;
    if ((result = /([\S]*)?\s*(in|of|times)\s*(\[.*\]|[\S]*)/ig.exec(attrValue)) !== null) {
      if ((!result[1] && result[2] !== 'times') || !result[2] || !result[3]) {
        throw new IncorrectExpressionBinderException(1, "parseRepeat function failed");
      }
      let object = result[3],
        objectMatch;
      if ((objectMatch = /\[.*\]/ig.exec(object)) !== null) {
        try {
          object = JSON.parse(objectMatch[0])
        } catch (jsonParserException) {
          throw new IncorrectExpressionBinderException(2, jsonParserException.message);
        }
      }
      return {
        variableName: result[1],
        object,
        iteration: result[2]
      };
    }
    throw new IncorrectExpressionBinderException(0, "parseRepeat function failed");
  }
}
