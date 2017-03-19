interface Node {
  binderHash: string;
}
abstract class BinderNode {
  element: Node;

  protected _binderHash: string;
  protected _binderScope: BinderScope;
  protected _desiredVariables: any[];
  protected _originalNode: Node;
  protected _settings: BinderSettings;
  protected _uid: string;

  get uid(): string {
    return this._uid;
  }

  get binderScope() {
    return this._binderScope;
  }

  constructor(element: Node, settings: BinderSettings) {
    this.element = element;
    this._originalNode = this.element.cloneNode(true);
    this._settings = settings;
    this._binderScope = new BinderScope(this);
    this._binderHash = BinderHash.getInstance().linkNode(this.element, this);
    this._uid = Array(1).fill(0).map(() => { return (Math.random() * 100 % 20).toString(20).slice(2); }).join('').toUpperCase();
    // console.log(this.uid);
  }

  abstract parse(): void;
  abstract updateTree(): void;

  get parentBinderNode(): BinderNode {
    return BinderHash.getInstance().getBinderNode(this.element.parentElement);
  }

  get childBinderNodes(): BinderNode[] {
    let binderNodes: BinderNode[] = [],
      binderHash = BinderHash.getInstance(),
      childNodes = this.element.childNodes;
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

  manipulate(toTheLeaf?: boolean) {

  }

  abstract replicateOriginal(): BinderNode;

}
class BinderElementNode extends BinderNode {

  protected _binderLocalVariables: BinderVariable[];
  protected _binderRepeatIndex: number;

  protected _isRepeating: boolean = true;
  protected _manipulators: BinderManipulator[] = [];

  isManipulable: boolean = true;

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
        }, 'repeater')
      }
    }
  }

  manipulate(toTheLeaf?: boolean) {
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
      } else {
        let childBinderNode = new BinderElementNode(this.element.childNodes[i], this._settings);
        childBinderNode.updateTree();
      }
    }
  }

  replicateOriginal(): BinderElementNode {
    let elementClone = this._originalNode.cloneNode(true);
    // let newBinderNodes = this.childBinderNodes.map(binderNode => binderNode.replicateOriginal());
    // newBinderNodes.forEach(binderNode => elementClone.appendChild(binderNode.element))
    let copy = new BinderElementNode(elementClone, this._settings);
    copy.updateTree();
    return copy;
  }

}

class BinderTextNode extends BinderNode {
  protected _binderRepeatIndex: number;
  protected _desiredVariablesWatchers: ValueWatcher[] = [];
  protected _settings: BinderSettings;

  constructor(element: Node, settings: BinderSettings) {
    super(element, settings);
  }

  parse() {
    let
      tail = this._originalNode.nodeValue,
      variable,
      variables = [];
    while ((variable = /{{([^}]+)}}(.*)/ig.exec(tail)) !== null) {
      variables.push(variable[1]);
      tail = variable[2];
    }
    this._desiredVariables = variables;
    this._watchDesiredVariables();
  }

  _watchDesiredVariables() {
    // TODO: prevent watcher replication
    this._desiredVariables.forEach(variableName => {
      BinderWatcher.watchBinderNode(this, variableName, () => {
        console.log('change')
        this.updateBinds();
      }, variableName);
    })
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
        } catch (ex) {
          variableValue = undefined;
        }
      }
      value = value.replace(new RegExp(`\{\{${regExEscapedVariableName}\}\}`, 'g'), variableValue);
    })
    this.element.nodeValue = value;
  }

  updateTree() {
    this.updateBinds();
  }

  replicateOriginal(): BinderTextNode {
    let elementClone = this._originalNode.cloneNode(true);
    // let newBinderNodes = this.childBinderNodes.map(binderNode => binderNode.replicateOriginal());
    // newBinderNodes.forEach(binderNode => elementClone.appendChild(binderNode.element))
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
  protected _owner: BinderNode;
  protected _variables: { [key: string]: BinderVariable } = {};
  constructor(owner: BinderNode) {
    this._owner = owner;
  }
  registerVariable(variable: BinderVariable) {
    this._variables[variable.name] = variable;
  }
  unregisterVariable(variableName: string) {
    delete this._variables[variableName];
  }
  getParentScope(): BinderScope {
    let ownerParent = this._owner.parentBinderNode;
    if (ownerParent) {
      return ownerParent.binderScope
    }
    return undefined;
  }
  getVariableByName(variableName: string, calledFrom?: BinderScope): BinderVariable {
    if (typeof this._variables[variableName] === "undefined") {
      let parentScope = this.getParentScope();
      return parentScope
        ? parentScope.getVariableByName(variableName, calledFrom)
        : DataMatcher.getInstance().getAsBinderVariable(variableName);
    } else {
      if (BinderVariable.isReservedVariable(variableName)) {
      }
      return this._variables[variableName];
    }
  }
  getVariableValueByName(variableName: string): any {
    let variable = this.getVariableByName(variableName);
    return variable.getValue();
  }
}

class BinderVariable {

  protected _container: any;
  protected _key: number | string;
  protected _name: string;

  get name() {
    return this._name;
  }

  constructor(container: any, key: number | string, name?: string) {
    this._container = container;
    this._key = key;
    this._name = name;
  }

  getValue(): any {
    if (typeof this._container === 'object' && this._container) {
      return this._container[this._key];
    }
    return this._container;
  }

  static isReservedVariable(variableName: string): boolean {
    return [
      "$index"
    ].some(name => Object.is(name, variableName));
  }
}