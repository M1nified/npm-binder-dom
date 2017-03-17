abstract class Apply {
  protected _settings: ISettings;
  constructor(settings: ISettings) {
    this._settings = settings;
  }
  abstract apply(element: Element): void;
  abstract applySafe(element: Element): void;
}
class ApplyValue extends Apply {
  protected _attrName: string;
  constructor(settings: ISettings) {
    super(settings);
    this._attrName = this._settings.data + "-value";
  }
  apply(element: Element) {
    if (typeof this._settings.data[this._attrName] === 'undefined') {
      this._settings.data[this._attrName] = undefined;
    }
    if (["input", "textarea"].some(tag => { return element.tagName == tag; })) {
      this._applyInputTextarea(<HTMLInputElement>element);
    } else {
      throw new ApplyElementNotSupportedBinderException(1);
    }
  }
  applySafe(element: Element) {
    if (element.hasAttribute(this._attrName)) {
      return this.apply(element);
    } else {
      return false;
    }
  }

  protected _applyInputTextarea(element: HTMLInputElement | HTMLTextAreaElement) {
    let value = DataMatcher.getInstance().getValue(element.getAttribute(this._attrName));
    element.value = value === undefined ? '' : value;
  }
}

class ApplyChain {
  private static _applyObjects: Apply[] = [];
  static addApplyObject(applyObject: Apply) {
    ApplyChain._applyObjects.push(applyObject);
  }
  static apply(element: Element) {
    ApplyChain._applyObjects.forEach(applyObject => {
      applyObject.applySafe(element);
    })
  }
}