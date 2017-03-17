interface ISettings {
  data?: any,
  directives?: IDirectives,
  prefix?: string
}
interface IDirectives {
  model?: string
  repeat?: string,
  value?: string,
}
class BinderSettings {
  static _defaultSettings: ISettings = {
    data: {},
    prefix: 'data-binder-',
    directives: {
      model: "model",
      repeat: "repeat",
      value: "value"
    }
  };

  private _settings: ISettings;

  get settings() {
    return this._settings;
  }

  constructor(settings: ISettings) {
    this._settings = Object.assign(BinderSettings._defaultSettings, settings);
    this._settings.data = settings.data;
  }

  getAttribute(directiveName: string): string {
    return this._settings.prefix + (<any>this._settings.directives)[directiveName];
  }

  get attrModel() { return this.getAttribute('model'); }
  get attrRepeat() { return this.getAttribute('repeat'); }
  get attrValue() { return this.getAttribute('value'); }

}