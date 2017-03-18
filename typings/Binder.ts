class Binder {

  private _rootBinderNode: BinderElementNode;
  private _settings: BinderSettings;

  constructor(data: Object, settings?: ISettings) {

    this._settings = new BinderSettings(settings, data);

    DataMatcher.getInstance(this._settings);

    ApplyChain.addApplyObject(new ApplyValue(this._settings));

    let parser = new Parser(this._settings);

    this._rootBinderNode = new BinderElementNode(document.getElementsByTagName('html')[0], this._settings);
    this._rootBinderNode.updateTree();

  }
}