abstract class IBinderWatcher {
  abstract start(): void;
  abstract stop(): void;
}
class BinderWatcher {
  static _binderNodeWatchers: BinderNodeWatcher[] = [];
  static _activeWatchers: { [key: string]: { [key: string]: IBinderWatcher } } = {}
  static watchBinderNode(binderNode: BinderNode, variableName: string, onChangeCallback: Function, watcherName?: string) {
    let watcher = new BinderNodeWatcher();
    watcher.binderNode = binderNode;
    watcher.variableName = variableName;
    watcher.callback = onChangeCallback;
    if (watcherName) {
      if (this._activeWatchers[binderNode.uid]) {
        this._activeWatchers[binderNode.uid][watcherName] && this._activeWatchers[binderNode.uid][watcherName].stop();
      } else {
        this._activeWatchers[binderNode.uid] || (this._activeWatchers[binderNode.uid] = {});
      }
      this._activeWatchers[binderNode.uid][watcherName] = watcher;
    }
    // TODO: should wait for previous to stop?
    watcher.start();
    BinderWatcher._binderNodeWatchers.push(watcher);
  }
  static deleteNodeWatchers(binderNode: BinderNode) {
    if (this._activeWatchers[binderNode.uid]) {
      for (let watcherName in this._activeWatchers[binderNode.uid]) {
        this._activeWatchers[binderNode.uid][watcherName].stop();
      }
    }
  }
}

class BinderNodeWatcher extends IBinderWatcher {
  protected _binderNode: BinderNode;
  protected _callback: Function;
  protected _timeout: any;
  protected _previousValue: any;
  protected _shouldStop: boolean = false;
  protected _variableName: string;
  set binderNode(newValue: BinderNode) {
    this._binderNode = newValue;
  }
  set callback(newValue: Function) {
    this._callback = newValue;
  }
  set variableName(newValue: string) {
    this._variableName = newValue;
  }
  protected _getCurrentValue(): any {
    return this._binderNode.binderScope.getVariableValueByName(this._variableName);
  }
  protected _loop() {
    this._timeout = setTimeout(
      () => {
        let currentValue = this._getCurrentValue();
        if (!Object.is(currentValue, this._previousValue)) {
          this._callback();
          this._updatePreviousValue();
        }
        !this._shouldStop && this._loop();
      },
      100
    )
  }
  start() {
    this._updatePreviousValue();
    this._loop();
  }
  stop() {
    // console.log('STOP', this)
    this._shouldStop = true;
    clearTimeout(this._timeout);
  }
  protected _updatePreviousValue() {
    this._previousValue = this._getCurrentValue();
  }
}