class Binder {

  private _domElements: any;
  private _settings: BinderSettings;

  constructor(data: Object, settings?: ISettings) {

    this._settings = new BinderSettings(settings);

    ApplyChain.addApplyObject(new ApplyValue(this._settings));

    let parser = new Parser(this._settings);

  }
}