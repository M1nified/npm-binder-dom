class BinderException {
    get name() {
        return this.constructor.name;
    }
    constructor(code, message) {
        if (typeof code === "string") {
            this.message = code;
        }
        else {
            this.code = code;
            this.message = message;
        }
    }
    toString() {
        return this.name + ", code: " + this.code + ". Message: \"" + this.message + "\"";
    }
}
class ApplyElementNotSupportedBinderException extends BinderException {
}
class DataMatcher {
    constructor(settings) {
        this._settings = settings;
    }
    static getInstance(settings) {
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
        if (["input", "textarea"].some(tag => { return element.tagName == tag; })) {
            this._applyInputTextarea(element);
        }
        else {
            throw new ApplyElementNotSupportedBinderException(1);
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
    _applyInputTextarea(element) {
        let value = DataMatcher.getInstance().getValue(element.getAttribute(this._attrName));
        element.value = value === undefined ? '' : value;
    }
}
class ApplyChain {
    static addApplyObject(applyObject) {
        ApplyChain._applyObjects.push(applyObject);
    }
    static apply(element) {
        ApplyChain._applyObjects.forEach(applyObject => {
            applyObject.applySafe(element);
        });
    }
}
ApplyChain._applyObjects = [];
class Binder {
    constructor(data, settings) {
        this._settings = Object.assign(Binder._defaultSettings, settings);
        this._settings.data = settings.data;
        ApplyChain.addApplyObject(new ApplyValue(this._settings));
    }
}
Binder._defaultSettings = {};
if (typeof exports !== 'undefined') {
    exports.Binder = Binder;
}
//# sourceMappingURL=index.js.map