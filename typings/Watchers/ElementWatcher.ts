class ElementWatcherFactory {
  static getWatcher(element: Element, elementAttr: string): any {
    let watcher = [
      ElementWatcherOfValue,
      ElementWatcherOfAnyAttribute
    ].find((watcher) => watcher.isCompatible(element, elementAttr));
    return watcher;
  }
}

abstract class ElementWatcher {
  callback: Function;
  protected _observedElement: Element;
  constructor(observerElement: Element) {
    this._observedElement = observerElement;
  }
  dispatch(): void {
    if (typeof this.callback === "function") {
      this.callback();
    }
  }
  static isCompatible(element: Element, elementAttr: string): boolean {
    return false;
  }
  abstract start(): void;
  abstract stop(): void;
}

class ElementWatcherOfValue extends ElementWatcher {
  static isCompatible(element: Element, elementAttr: string) {
    return elementAttr === 'value' && ["input", "textarea", "select"].some(tag => { return element.tagName == tag.toLowerCase(); })
  }
  start() {
    this._observedElement.addEventListener('change', this.dispatch);
    this._observedElement.addEventListener('keypress', this.dispatch);
  }
  stop() {
    this._observedElement.removeEventListener('change', this.dispatch);
    this._observedElement.removeEventListener('keypress', this.dispatch);
  }
}

class ElementWatcherOfAnyAttribute extends ElementWatcher {
  static isCompatible(element: Element, elementAttr: string) {
    return true;
  }
  start() {
    this._observedElement.addEventListener('change', this.dispatch);
    this._observedElement.addEventListener('keypress', this.dispatch);
  }
  stop() {
    this._observedElement.removeEventListener('change', this.dispatch);
    this._observedElement.removeEventListener('keypress', this.dispatch);
  }
}