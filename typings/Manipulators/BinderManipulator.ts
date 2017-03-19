abstract class BinderManipulator {

  protected _owner: BinderElementNode;
  protected _settings: BinderSettings;

  constructor() {
  }

  abstract manipulate(): void;

  init(owner: BinderElementNode, settings: BinderSettings) {
    this._owner = owner;
    this._settings = settings;
  }

}

class BinderManipulatorNull extends BinderManipulator {
  manipulate() {

  }
}