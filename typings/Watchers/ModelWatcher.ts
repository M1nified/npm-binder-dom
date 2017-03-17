class ModelWatcher {
  private _bindedElement: Element;
  private _elementWatcher: any;
  private _observedAttr: string;
  private _observedKey: string;
  private _observedObject: any;
  private _valueWatcher: BindedValueWatcher;

  constructor(element: Element, elementAttr: string, object: any, key: string) {
    this._bindedElement = element;
    this._observedAttr = elementAttr;
    this._observedObject = object;
    this._observedKey = key;
    this._startWatching();
  }

  private _startWatching() {
    this._valueWatcher = new BindedValueWatcher(this._bindedElement, this._observedObject, this._observedKey)
    let elementWatcherConstructor = ElementWatcherFactory.getWatcher(this._bindedElement, this._observedAttr);
    this._elementWatcher = new elementWatcherConstructor();
    this._elementWatcher.callback = this._elementWatcherCallback;
  }

  private _elementWatcherCallback() {
    
  }

}