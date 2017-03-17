class Binder {
  static _defaultSettings = {

  }

  private _settings: ISettings;

  constructor(data: Object, settings: ISettings) {
    // this._settings = settings;
    // Object.keys(Binder._defaultSettings).forEach(key => {
    //   if (this._settings[key] === undefined) {
    //     this._settings[key] = _def
    //   }
    // })
    this._settings = Object.assign(Binder._defaultSettings, settings);
    this._settings.data = settings.data;

    ApplyChain.addApplyObject(new ApplyValue(this._settings));

  }
}