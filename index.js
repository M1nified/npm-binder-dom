class BinderTools {
    static addSiblingAfter(baseNode, newNode) {
        let allNodes = [...baseNode.parentNode.childNodes].filter(node => !Object.is(Node.TEXT_NODE, node.nodeType));
        let indexOfbaseNode = allNodes.indexOf(baseNode);
        if (indexOfbaseNode === allNodes.length) {
            baseNode.parentElement.appendChild(newNode);
        }
        else {
            baseNode.parentElement.insertBefore(newNode, baseNode.nextSibling);
        }
    }
}
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
        return hash;
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
class BinderManipulator {
    constructor() {
    }
    init(owner, settings) {
        this._owner = owner;
        this._settings = settings;
    }
}
class BinderManipulatorNull extends BinderManipulator {
    manipulate() {
    }
}
class BinderManipulatorRepeater extends BinderManipulator {
    constructor() {
        super(...arguments);
        this._repeatedElements = [];
    }
    init(owner, settings) {
        super.init(owner, settings);
        let parsed = AttrParser.parseRepeat(this._owner.element.attributes.getNamedItem(this._settings.attrRepeat).value);
        this._loopVariableName = parsed.variableName;
        this._loopObject = parsed.object;
    }
}
class BinderManipulatorRepeaterFactory {
    static produce(repeaterType) {
        if (repeaterType === "times")
            return new BinderManipulatorRepeaterTimes();
        return new BinderManipulatorRepeaterNull();
    }
}
class BinderManipulatorRepeaterNull extends BinderManipulatorRepeater {
    manipulate() {
    }
}
class BinderManipulatorRepeaterTimes extends BinderManipulatorRepeater {
    manipulate() {
        this._repeatedElements.forEach(element => element.destroy());
        this._repeatedElements = [];
        let count = typeof this._loopObject === "number" ? this._loopObject : this._owner.binderScope.getVariableValueByName(this._loopObject);
        this._owner.binderScope.registerVariable(new BinderVariable(0, null, "$index"));
        for (let i = 1; i < count; i++) {
            let newBinderNode = this._owner.replicateOriginal();
            newBinderNode.isManipulable = false;
            let variableIndex = new BinderVariable(i, null, "$index");
            newBinderNode.binderScope.registerVariable(variableIndex);
            BinderTools.addSiblingAfter((this._repeatedElements[this._repeatedElements.length - 1] || this._owner).element, newBinderNode.element);
            newBinderNode.manipulate(true);
            this._repeatedElements.push(newBinderNode);
        }
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
    get uid() {
        return this._uid;
    }
    get binderScope() {
        return this._binderScope;
    }
    constructor(element, settings) {
        this.element = element;
        this._originalNode = this.element.cloneNode(true);
        this._settings = settings;
        this._binderScope = new BinderScope(this);
        this._binderHash = BinderHash.getInstance().linkNode(this.element, this);
        this._uid = Array(1).fill(0).map(() => { return (Math.random() * 100 % 20).toString(20).slice(2); }).join('').toUpperCase();
    }
    get parentBinderNode() {
        return BinderHash.getInstance().getBinderNode(this.element.parentElement);
    }
    get childBinderNodes() {
        let binderNodes = [], binderHash = BinderHash.getInstance(), childNodes = this.element.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            binderNodes.push(binderHash.getBinderNode(childNodes[i]));
        }
        binderNodes = binderNodes.filter(node => node);
        return binderNodes;
    }
    destroy() {
        this.element.parentElement.removeChild(this.element);
        BinderWatcher.deleteNodeWatchers(this);
    }
    manipulate(toTheLeaf) {
    }
}
class BinderElementNode extends BinderNode {
    constructor() {
        super(...arguments);
        this._isRepeating = true;
        this._manipulators = [];
        this.isManipulable = true;
    }
    parse() {
        if (this.isManipulable && this.element.attributes.getNamedItem(this._settings.attrRepeat)) {
            let parsed = AttrParser.parseRepeat(this.element.attributes.getNamedItem(this._settings.attrRepeat).value);
            this._isRepeating = true;
            let repeater = BinderManipulatorRepeaterFactory.produce(parsed.iteration);
            repeater.init(this, this._settings);
            this._manipulators.push(repeater);
            this.binderScope.registerVariable(new BinderVariable(null, null, 'test'));
            if (typeof parsed.object === "string") {
                BinderWatcher.watchBinderNode(this, parsed.object, () => {
                    this.manipulate(true);
                }, 'repeater');
            }
        }
    }
    manipulate(toTheLeaf) {
        if (this.isManipulable) {
            this._manipulators.forEach(manipulator => manipulator.manipulate());
        }
        toTheLeaf && this.childBinderNodes.forEach(binderNode => binderNode.manipulate(true));
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
                childTextNode.updateBinds();
            }
            else {
                let childBinderNode = new BinderElementNode(this.element.childNodes[i], this._settings);
                childBinderNode.updateTree();
            }
        }
    }
    replicateOriginal() {
        let elementClone = this._originalNode.cloneNode(true);
        let copy = new BinderElementNode(elementClone, this._settings);
        copy.updateTree();
        return copy;
    }
}
class BinderTextNode extends BinderNode {
    constructor(element, settings) {
        super(element, settings);
        this._desiredVariablesWatchers = [];
    }
    parse() {
        let tail = this._originalNode.nodeValue, variable, variables = [];
        while ((variable = /{{([^}]+)}}(.*)/ig.exec(tail)) !== null) {
            variables.push(variable[1]);
            tail = variable[2];
        }
        this._desiredVariables = variables;
        this._watchDesiredVariables();
    }
    _watchDesiredVariables() {
        this._desiredVariables.forEach(variableName => {
            BinderWatcher.watchBinderNode(this, variableName, () => {
                console.log('change');
                this.updateBinds();
            }, variableName);
        });
    }
    autoUpdateStart() {
        this.updateBinds();
    }
    updateBinds() {
        let value = this._originalNode.nodeValue;
        this._desiredVariables.forEach(variableName => {
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
        this.updateBinds();
    }
    replicateOriginal() {
        let elementClone = this._originalNode.cloneNode(true);
        let copy = new BinderTextNode(elementClone, this._settings);
        copy.parse();
        copy.updateBinds();
        return copy;
    }
    manipulate() {
        this.updateBinds();
    }
}
class BinderScope {
    constructor(owner) {
        this._variables = {};
        this._owner = owner;
    }
    registerVariable(variable) {
        this._variables[variable.name] = variable;
    }
    unregisterVariable(variableName) {
        delete this._variables[variableName];
    }
    getParentScope() {
        let ownerParent = this._owner.parentBinderNode;
        if (ownerParent) {
            return ownerParent.binderScope;
        }
        return undefined;
    }
    getVariableByName(variableName, calledFrom) {
        if (typeof this._variables[variableName] === "undefined") {
            let parentScope = this.getParentScope();
            return parentScope
                ? parentScope.getVariableByName(variableName, calledFrom)
                : DataMatcher.getInstance().getAsBinderVariable(variableName);
        }
        else {
            if (BinderVariable.isReservedVariable(variableName)) {
            }
            return this._variables[variableName];
        }
    }
    getVariableValueByName(variableName) {
        let variable = this.getVariableByName(variableName);
        return variable.getValue();
    }
}
class BinderVariable {
    get name() {
        return this._name;
    }
    constructor(container, key, name) {
        this._container = container;
        this._key = key;
        this._name = name;
    }
    getValue() {
        if (typeof this._container === 'object' && this._container) {
            return this._container[this._key];
        }
        return this._container;
    }
    static isReservedVariable(variableName) {
        return [
            "$index"
        ].some(name => Object.is(name, variableName));
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
            else {
                let number = Number(object);
                if (!isNaN(number)) {
                    object = number;
                }
            }
            return {
                variableName: result[1],
                iteration: result[2],
                object: object
            };
        }
        throw new IncorrectExpressionBinderException(0, "parseRepeat function failed");
    }
}
class IBinderWatcher {
}
class BinderWatcher {
    static watchBinderNode(binderNode, variableName, onChangeCallback, watcherName) {
        let watcher = new BinderNodeWatcher();
        watcher.binderNode = binderNode;
        watcher.variableName = variableName;
        watcher.callback = onChangeCallback;
        if (watcherName) {
            if (this._activeWatchers[binderNode.uid]) {
                this._activeWatchers[binderNode.uid][watcherName] && this._activeWatchers[binderNode.uid][watcherName].stop();
            }
            else {
                this._activeWatchers[binderNode.uid] || (this._activeWatchers[binderNode.uid] = {});
            }
            this._activeWatchers[binderNode.uid][watcherName] = watcher;
        }
        watcher.start();
        BinderWatcher._binderNodeWatchers.push(watcher);
    }
    static deleteNodeWatchers(binderNode) {
        if (this._activeWatchers[binderNode.uid]) {
            for (let watcherName in this._activeWatchers[binderNode.uid]) {
                this._activeWatchers[binderNode.uid][watcherName].stop();
            }
        }
    }
}
BinderWatcher._binderNodeWatchers = [];
BinderWatcher._activeWatchers = {};
class BinderNodeWatcher extends IBinderWatcher {
    constructor() {
        super(...arguments);
        this._shouldStop = false;
    }
    set binderNode(newValue) {
        this._binderNode = newValue;
    }
    set callback(newValue) {
        this._callback = newValue;
    }
    set variableName(newValue) {
        this._variableName = newValue;
    }
    _getCurrentValue() {
        return this._binderNode.binderScope.getVariableValueByName(this._variableName);
    }
    _loop() {
        this._timeout = setTimeout(() => {
            let currentValue = this._getCurrentValue();
            if (!Object.is(currentValue, this._previousValue)) {
                this._callback();
                this._updatePreviousValue();
            }
            !this._shouldStop && this._loop();
        }, 100);
    }
    start() {
        this._updatePreviousValue();
        this._loop();
    }
    stop() {
        this._shouldStop = true;
        clearTimeout(this._timeout);
    }
    _updatePreviousValue() {
        this._previousValue = this._getCurrentValue();
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
        this._rootBinderNode.manipulate(true);
    }
}
if (typeof exports !== 'undefined') {
    exports.Binder = Binder;
}
//# sourceMappingURL=index.js.map