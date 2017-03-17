class ValueWatcher {
  private _callback: Function;
  private _interval: any;
  private _observedKey: string;
  private _observedObject: any;
  private _previousValue: any;

  set callback(callback: Function) {
    this._callback = callback;
  }

  constructor(object: any, key: string, callback?: Function) {
    this._observedObject = object;
    this._observedKey = key;
    this._callback = callback;
    this._updatePreviousValue();
    this._startWatching();
  }

  destroy() {
    clearInterval(this._interval);
  }

  private _startWatching() {
    this._interval = setInterval(() => {
      if (!Object.is(this._previousValue, this._observedObject[this._observedKey])) {
        this._updatePreviousValue();
        typeof this._callback === "function" && setTimeout(this._callback, 0);
      }
    }, 10);
  }

  private _updatePreviousValue() {
    this._previousValue = this._observedObject[this._observedKey];
  }

}

class BindedValueWatcher {
  private _bindedElement: Element;
  private _observedKey: string;
  private _observedObject: any;
  private _valueWatcher: ValueWatcher;

  constructor(bindedElement: Element, object: any, key: string) {
    this._observedObject = object;
    this._observedKey = key;
    this._bindedElement = bindedElement;
    this._startWatching();
  }

  destroy() {
    try {
      this._valueWatcher.destroy();
    } catch (ex) { }
  }

  private _startWatching() {
    this._valueWatcher = new ValueWatcher(this._observedObject, this._observedKey, this._valueWatcherCallback);
  }
  private _valueWatcherCallback() {
    ApplyChain.apply(this._bindedElement);
  }

}