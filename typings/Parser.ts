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

  abstract parse(): void;
}

class ParserRealRepeat extends ParserReal {
  parse() {

  }
}

class ParserRealValue extends ParserReal {
  parse() {
    
  }
}