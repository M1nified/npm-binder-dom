class Binder {
    constructor(settings) {
        this._settings = settings;
    }
    static getInstance(settings) {
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
    getValue(variableName) {
        let chain = variableName.split('.'), tail = this._settings.data;
        for (let i = 0; typeof tail === 'object' && i < chain.length; tail = tail[chain[i++]])
            ;
        return tail;
    }
    setValue(variableName, value) {
        let chain = variableName.split('.'), tail = this._settings.data, limit = chain.length - 1;
        for (let i = 0; i < limit; tail = tail[chain[i++]]) {
            if (typeof tail[chain[i]] !== 'object') {
                tail[chain[i]] = {};
            }
        }
        tail[chain[chain.length - 1]] = value;
    }
}
class Apply {
    constructor(settings) {
        this._settings = settings;
    }
}
class ApplyValue extends Apply {
    constructor(settings) {
        super(settings);
        this._attrName = this._settings.data + "-value";
    }
    apply(element) {
        if (typeof this._settings.data[this._attrName] === 'undefined') {
            this._settings.data[this._attrName] = undefined;
        }
        if (["input"].some(tag => { return element.tagName == tag; })) {
            this._applyInput(element);
        }
    }
    applySafe(element) {
        if (element.hasAttribute(this._attrName)) {
            return this.apply(element);
        }
        else {
            return false;
        }
    }
    _applyInput(element) {
        let value = Binder.getInstance().getValue(element.getAttribute(this._attrName));
        element.value = value === undefined ? '' : value;
    }
}
//# sourceMappingURL=index.js.map