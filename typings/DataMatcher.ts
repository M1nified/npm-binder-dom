class DataMatcher {
  protected static _instance: DataMatcher;
  protected _settings: BinderSettings;
  protected constructor(settings: BinderSettings) {
    this._settings = settings;
  }
  static getInstance(settings?: BinderSettings): DataMatcher {
    if (!DataMatcher._instance) {
      if (typeof settings === 'undefined') {
        return null;
      }
      DataMatcher._instance = new DataMatcher(settings);
    }
    return DataMatcher._instance;
  }
  static clean() {
    delete DataMatcher._instance;
    DataMatcher._instance = undefined;
  }
  getValue(variableName: string) {
    let chain = variableName.split('.'),
      tail = this._settings.settings.data;
    for (let i = 0; typeof tail === 'object' && i < chain.length; tail = tail[chain[i++]]);
    return tail;
  }
  getAsBinderVariable(variableName: string) {
    let chain = variableName.split('.'),
      tail = this._settings.settings.data;
    for (let i = 0; typeof tail === 'object' && i < chain.length - 1; tail = tail[chain[i++]]);
    let variable = new BinderVariable(tail, chain[chain.length - 1]);
    return variable;
  }
  setValue(variableName: string, value: any) {
    let chain = variableName.split('.'),
      tail = this._settings.settings.data,
      limit = chain.length - 1;
    for (let i = 0; i < limit; tail = tail[chain[i++]]) {
      if (typeof tail[chain[i]] !== 'object') {
        tail[chain[i]] = {};
      }
    }
    tail[chain[chain.length - 1]] = value;
  }
}