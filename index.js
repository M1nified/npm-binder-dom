class BinderHash {
    constructor() {
        this._lastHash = null;
        this._hashMap = {};
        this._generator = this.hashCountGenerator();
    }
    get hashMap() {
        return this._hashMap;
    }
    static getInstance() {
        if (!BinderHash._instance) {
            BinderHash._instance = new BinderHash();
        }
        return BinderHash._instance;
    }
    next() {
        return "binderHash:" + this._generator.next().value;
    }
    linkNode(node, binderNode) {
        let hash = this.next();
        node.binderHash = hash;
        this._hashMap[hash] = binderNode;
    }
    getBinderNode(node) {
        if (typeof node !== "string" && node) {
            node = node.binderHash;
        }
        return this._hashMap[node];
    }
    *hashCountGenerator() {
        while (true)
            yield ++this._lastHash;
    }
}
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
class IncorrectExpressionBinderException extends BinderException {
}
class BinderNode {
    get binderScope() {
        return this._binderScope;
    }
    constructor(element, settings) {
        this.element = element;
        this._settings = settings;
        this._binderScope = new BinderScope(this);
        BinderHash.getInstance().linkNode(this.element, this);
        console.log(this.element);
    }
    get parentBinderNode() {
        return BinderHash.getInstance().getBinderNode(this.element.parentElement);
    }
    get childBinderNodes() {
        let binderNodes = [], binderHash = BinderHash.getInstance(), childNodes = this.element.childNodes;
        for (let i in childNodes) {
            binderNodes.push(binderHash.getBinderNode(childNodes[i]));
        }
        return binderNodes;
    }
}
class BinderElementNode extends BinderNode {
    parse() {
    }
    updateTree() {
        if ([
            "script",
            "text",
            "#text",
        ].some(type => Object.is(type, this.element.nodeName.toLowerCase()))) {
            return;
        }
        this.parse();
        for (let i = 0; i < this.element.childNodes.length; i++) {
            if (this.element.childNodes[i].nodeType === Node.TEXT_NODE) {
                let childTextNode = new BinderTextNode(this.element.childNodes[i], this._settings);
                childTextNode.parse();
                childTextNode.autoUpdateStart();
            }
            else {
                let childBinderNode = new BinderElementNode(this.element.childNodes[i], this._settings);
                childBinderNode.updateTree();
            }
        }
    }
}
class BinderTextNode extends BinderNode {
    constructor(element, settings) {
        super(element, settings);
        this._originalNodeValue = this.element.nodeValue;
    }
    parse() {
        let tail = this._originalNodeValue, variable, variables = [];
        while ((variable = /{{([^}]+)}}(.*)/ig.exec(tail)) !== null) {
            variables.push(variable[1]);
            tail = variable[2];
        }
        this._localVariablesNames = variables;
    }
    autoUpdateStart() {
        this.updateBinds();
    }
    updateBinds() {
        let value = this._originalNodeValue;
        this._localVariablesNames.forEach(variableName => {
            let regExEscapedVariableName = variableName.toString().replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
            let variableValue = this._binderScope.getVariableValueByName(variableName);
            if (typeof variableValue !== "string") {
                try {
                    variableValue = variableValue.toString();
                }
                catch (ex) {
                    variableValue = undefined;
                }
            }
            value = value.replace(new RegExp(`\{\{${regExEscapedVariableName}\}\}`, 'g'), variableValue);
        });
        this.element.nodeValue = value;
    }
    updateTree() {
    }
}
class BinderScope {
    constructor(owner) {
        this._variables = {};
        this._owner = owner;
    }
    registerVariable(variableName) {
    }
    unregisterVariable(variableName) {
        delete this._variables[variableName];
    }
    getParentBinderScope() {
        let ownerParent = this._owner.parentBinderNode;
        if (ownerParent) {
            return ownerParent.binderScope;
        }
        return undefined;
    }
    getVariableByName(variableName) {
        if (typeof this._variables[variableName] === "undefined") {
            let parentScope = this.getParentBinderScope();
            return parentScope
                ? parentScope.getVariableByName(variableName)
                : DataMatcher.getInstance().getAsBinderVariable(variableName);
        }
        else {
            return this._variables[variableName];
        }
    }
    getVariableValueByName(variableName) {
        console.log("variableName", variableName);
        let variable = this.getVariableByName(variableName);
        console.log("variable", variable);
        return variable.getValue();
    }
}
class BinderVariable {
    constructor(container, key) {
        this._container = container;
        this._key = key;
    }
    getValue() {
        if (typeof this._container === 'object') {
            return this._container[this._key];
        }
        return this._container;
    }
}
class BinderSettings {
    constructor(settings, data) {
        this._settings = Object.assign(BinderSettings._defaultSettings, settings);
        this._settings.data = data;
    }
    get settings() {
        return this._settings;
    }
    get data() {
        return this._settings.data;
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
    getAsBinderVariable(variableName) {
        let chain = variableName.split('.'), tail = this._settings.settings.data;
        for (let i = 0; typeof tail === 'object' && i < chain.length - 1; tail = tail[chain[i++]])
            ;
        let variable = new BinderVariable(tail, chain[chain.length - 1]);
        return variable;
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
    parse(element) {
    }
}
class ParserRealValue extends ParserReal {
    parse(element) {
    }
}
class AttrParser {
    static parseRepeat(attrValue) {
        let result;
        if ((result = /([\S]*)?\s*(in|of|times)\s*(\[.*\]|[\S]*)/ig.exec(attrValue)) !== null) {
            if ((!result[1] && result[2] !== 'times') || !result[2] || !result[3]) {
                throw new IncorrectExpressionBinderException(1, "parseRepeat function failed");
            }
            let object = result[3], objectMatch;
            if ((objectMatch = /\[.*\]/ig.exec(object)) !== null) {
                try {
                    object = JSON.parse(objectMatch[0]);
                }
                catch (jsonParserException) {
                    throw new IncorrectExpressionBinderException(2, jsonParserException.message);
                }
            }
            return {
                variableName: result[1],
                object,
                iteration: result[2]
            };
        }
        throw new IncorrectExpressionBinderException(0, "parseRepeat function failed");
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
        this._attrName = this._settings.data + this._settings.settings.directives.value;
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
        this._settings = new BinderSettings(settings, data);
        DataMatcher.getInstance(this._settings);
        ApplyChain.addApplyObject(new ApplyValue(this._settings));
        let parser = new Parser(this._settings);
        this._rootBinderNode = new BinderElementNode(document.getElementsByTagName('html')[0], this._settings);
        this._rootBinderNode.updateTree();
    }
}
if (typeof exports !== 'undefined') {
    exports.Binder = Binder;
}
//# sourceMappingURL=index.js.map