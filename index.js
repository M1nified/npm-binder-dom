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
class BinderSettings {
    constructor(settings) {
        this._settings = Object.assign(BinderSettings._defaultSettings, settings);
        this._settings.data = settings.data;
    }
    get settings() {
        return this._settings;
    }
    getAttribute(directiveName) {
        return this._settings.prefix + this._settings.directives[directiveName];
    }
    get attrModel() { return this.getAttribute('model'); }
    get attrRepeat() { return this.getAttribute('repeat'); }
    get attrValue() { return this.getAttribute('value'); }
}
BinderSettings._defaultSettings = {
    data: {},
    prefix: 'data-binder-',
    directives: {
        model: "model",
        repeat: "repeat",
        value: "value"
    }
};
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
        let chain = variableName.split('.'), tail = this._settings.settings.data;
        for (let i = 0; typeof tail === 'object' && i < chain.length; tail = tail[chain[i++]])
            ;
        return tail;
    }
    setValue(variableName, value) {
        let chain = variableName.split('.'), tail = this._settings.settings.data, limit = chain.length - 1;
        for (let i = 0; i < limit; tail = tail[chain[i++]]) {
            if (typeof tail[chain[i]] !== 'object') {
                tail[chain[i]] = {};
            }
        }
        tail[chain[chain.length - 1]] = value;
    }
}
class Parser {
    constructor(settings) {
        this._settings = settings;
    }
    parse(element) {
        if (element.hasAttribute(this._settings.attrRepeat)) {
        }
        else if (element.hasAttribute(this._settings.attrModel)) {
        }
        else if (element.hasAttribute(this._settings.attrValue)) {
        }
    }
}
class ParserReal {
    constructor(settings) {
        this.nextParser = null;
        this._settings = settings;
    }
    static getInstance(settings) {
        if (!ParserReal._instance) {
            if (typeof settings === 'undefined') {
                return null;
            }
            ParserReal._instance = new this(settings);
        }
        return ParserReal._instance;
    }
    next() {
        return this.nextParser;
    }
}
class ParserRealRepeat extends ParserReal {
    parse() {
    }
}
class ParserRealValue extends ParserReal {
    parse() {
    }
}
class ValueWatcher {
    set callback(callback) {
        this._callback = callback;
    }
    constructor(object, key, callback) {
        this._observedObject = object;
        this._observedKey = key;
        this._callback = callback;
        this._updatePreviousValue();
        this._startWatching();
    }
    destroy() {
        clearInterval(this._interval);
    }
    _startWatching() {
        this._interval = setInterval(() => {
            if (!Object.is(this._previousValue, this._observedObject[this._observedKey])) {
                this._updatePreviousValue();
                typeof this._callback === "function" && setTimeout(this._callback, 0);
            }
        }, 10);
    }
    _updatePreviousValue() {
        this._previousValue = this._observedObject[this._observedKey];
    }
}
class BindedValueWatcher {
    constructor(bindedElement, object, key) {
        this._observedObject = object;
        this._observedKey = key;
        this._bindedElement = bindedElement;
        this._startWatching();
    }
    destroy() {
        try {
            this._valueWatcher.destroy();
        }
        catch (ex) { }
    }
    _startWatching() {
        this._valueWatcher = new ValueWatcher(this._observedObject, this._observedKey, this._valueWatcherCallback);
    }
    _valueWatcherCallback() {
        ApplyChain.apply(this._bindedElement);
    }
}
class ModelWatcher {
    constructor(element, elementAttr, object, key) {
        this._bindedElement = element;
        this._observedAttr = elementAttr;
        this._observedObject = object;
        this._observedKey = key;
        this._startWatching();
    }
    _startWatching() {
        this._valueWatcher = new BindedValueWatcher(this._bindedElement, this._observedObject, this._observedKey);
        let elementWatcherConstructor = ElementWatcherFactory.getWatcher(this._bindedElement, this._observedAttr);
        this._elementWatcher = new elementWatcherConstructor();
        this._elementWatcher.callback = this._elementWatcherCallback;
    }
    _elementWatcherCallback() {
    }
}
class ElementWatcherFactory {
    static getWatcher(element, elementAttr) {
        let watcher = [
            ElementWatcherOfValue,
            ElementWatcherOfAnyAttribute
        ].find((watcher) => watcher.isCompatible(element, elementAttr));
        return watcher;
    }
}
class ElementWatcher {
    constructor(observerElement) {
        this._observedElement = observerElement;
    }
    dispatch() {
        if (typeof this.callback === "function") {
            this.callback();
        }
    }
    static isCompatible(element, elementAttr) {
        return false;
    }
}
class ElementWatcherOfValue extends ElementWatcher {
    static isCompatible(element, elementAttr) {
        return elementAttr === 'value' && ["input", "textarea", "select"].some(tag => { return element.tagName == tag.toLowerCase(); });
    }
    start() {
        this._observedElement.addEventListener('change', this.dispatch);
        this._observedElement.addEventListener('keypress', this.dispatch);
    }
    stop() {
        this._observedElement.removeEventListener('change', this.dispatch);
        this._observedElement.removeEventListener('keypress', this.dispatch);
    }
}
class ElementWatcherOfAnyAttribute extends ElementWatcher {
    static isCompatible(element, elementAttr) {
        return true;
    }
    start() {
        this._observedElement.addEventListener('change', this.dispatch);
        this._observedElement.addEventListener('keypress', this.dispatch);
    }
    stop() {
        this._observedElement.removeEventListener('change', this.dispatch);
        this._observedElement.removeEventListener('keypress', this.dispatch);
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
        this._attrName = this._settings.data + this._settings.directives.value;
    }
    apply(element) {
        if (typeof this._settings.data[this._attrName] === 'undefined') {
            this._settings.data[this._attrName] = undefined;
        }
        if (["input", "textarea"].some(tag => { return element.tagName == tag.toLowerCase(); })) {
            this._applyInputTextarea(element);
        }
        else {
            throw new ApplyElementNotSupportedBinderException(1);
        }
    }
    applySafe(element) {
        if (element.hasAttribute(this._attrName) && ["input", "textarea"].some(tag => { return element.tagName == tag.toLowerCase(); })) {
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
        this._settings = new BinderSettings(settings);
        ApplyChain.addApplyObject(new ApplyValue(this._settings));
        let parser = new Parser(this._settings);
    }
}
if (typeof exports !== 'undefined') {
    exports.Binder = Binder;
}
//# sourceMappingURL=index.js.map