interface Node {
  binderHash: string;
}
abstract class BinderNode {
  element: Node;

  protected _binderScope: BinderScope;
  protected _settings: BinderSettings;

  get binderScope() {
    return this._binderScope;
  }

  constructor(element: Node, settings: BinderSettings) {
    this.element = element;
    this._settings = settings;
    this._binderScope = new BinderScope(this);
    BinderHash.getInstance().linkNode(this.element, this);
    console.log(this.element)
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
    for (let i in childNodes) {
      binderNodes.push(binderHash.getBinderNode(childNodes[i]));
    }
    return binderNodes;
  }

}
class BinderElementNode extends BinderNode {

  protected _binderLocalVariables: BinderVariable[];
  protected _binderRepeatIndex: number;


  parse() {
    // if (this.element.hasAttribute(this._settings.attrRepeat)) {
    //   let parsed = AttrParser.parseRepeat(this.element.getAttribute(this._settings.attrRepeat));
    //   this._binderScope.registerVariable(parsed.variableName);
    // }
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
        // console.log(this.element.childNodes[i]);
        let childTextNode = new BinderTextNode(this.element.childNodes[i], this._settings);
        childTextNode.parse();
        childTextNode.autoUpdateStart();
      } else {
        let childBinderNode = new BinderElementNode(this.element.childNodes[i], this._settings);
        childBinderNode.updateTree();
      }
    }
  }

}

class BinderTextNode extends BinderNode {
  protected _binderRepeatIndex: number;
  protected _localVariablesNames: any[];
  protected _originalNodeValue: string;
  protected _settings: BinderSettings;

  constructor(element: Node, settings: BinderSettings) {
    super(element, settings);
    this._originalNodeValue = this.element.nodeValue;
  }

  parse() {
    let
      tail = this._originalNodeValue,
      variable,
      variables = [];
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
        } catch (ex) {
          variableValue = undefined;
        }
      }
      value = value.replace(new RegExp(`\{\{${regExEscapedVariableName}\}\}`, 'g'), variableValue);
    })
    this.element.nodeValue = value;
  }

  updateTree() {

  }

}

class BinderScope {
  protected _owner: BinderNode;
  protected _variables: { [key: string]: BinderVariable } = {};
  constructor(owner: BinderNode) {
    this._owner = owner;
  }
  registerVariable(variableName: string) {

  }
  unregisterVariable(variableName: string) {
    delete this._variables[variableName];
  }
  getParentBinderScope(): BinderScope {
    let ownerParent = this._owner.parentBinderNode;
    if (ownerParent) {
      return ownerParent.binderScope
    }
    return undefined;
  }
  getVariableByName(variableName: string): BinderVariable {
    if (typeof this._variables[variableName] === "undefined") {
      let parentScope = this.getParentBinderScope();
      return parentScope
        ? parentScope.getVariableByName(variableName)
        : DataMatcher.getInstance().getAsBinderVariable(variableName);
    } else {
      return this._variables[variableName];
    }
  }
  getVariableValueByName(variableName: string): any {
    console.log("variableName", variableName)
    let variable = this.getVariableByName(variableName);
    console.log("variable", variable)
    return variable.getValue();
  }
}

class BinderVariable {

  protected _container: any;
  protected _key: number | string;

  constructor(container: any, key: number | string) {
    this._container = container;
    this._key = key;
  }

  getValue(): any {
    if (typeof this._container === 'object') {
      return this._container[this._key];
    }
    return this._container;
  }

}