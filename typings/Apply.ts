class Apply {
  protected _settings: ISettings;
  constructor(settings: ISettings) {
    this._settings = settings;
  }
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
    if (["input"].some(tag => { return element.tagName == tag; })) {
      this._applyInput(<HTMLInputElement>element);
    }
  }
  applySafe(element: Element) {
    if (element.hasAttribute(this._attrName)) {
      return this.apply(element);
    } else {
      return false;
    }
  }

  protected _applyInput(element: HTMLInputElement) {
    let value = Binder.getInstance().getValue(element.getAttribute(this._attrName));
    element.value = value === undefined ? '' : value;
  }
}