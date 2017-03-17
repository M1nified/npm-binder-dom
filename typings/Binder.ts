class Binder {
  protected static _instance: Binder;
  protected _settings: ISettings;
  protected constructor(settings: ISettings) {
    this._settings = settings;
  }
  static getInstance(settings?: ISettings): Binder {
    if (!Binder._instance) {
      if (typeof settings === 'undefined') {
        return null;
      }
      Binder._instance = new Binder(settings);
    }
    return Binder._instance;
  }
  static clean() {
    delete Binder._instance;
    Binder._instance = undefined;
  }
  getValue(variableName: string) {
    let chain = variableName.split('.'),
      tail = this._settings.data;
    for (let i = 0; typeof tail === 'object' && i < chain.length; tail = tail[chain[i++]]);
    return tail;
  }
  setValue(variableName: string, value: any) {
    let chain = variableName.split('.'),
      tail = this._settings.data,
      limit = chain.length - 1;
    for (let i = 0; i < limit; tail = tail[chain[i++]]) {
      if (typeof tail[chain[i]] !== 'object') {
        tail[chain[i]] = {};
      }
    }
    tail[chain[chain.length - 1]] = value;
  }
}