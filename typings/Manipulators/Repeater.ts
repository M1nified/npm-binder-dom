abstract class BinderManipulatorRepeater extends BinderManipulator {
  protected _repeatedElements: BinderElementNode[] = [];
  protected _loopObject: any;
  protected _loopVariableName: string;
  init(owner: BinderElementNode, settings: BinderSettings) {
    super.init(owner, settings);
    let parsed = AttrParser.parseRepeat(this._owner.element.attributes.getNamedItem(this._settings.attrRepeat).value);
    this._loopVariableName = parsed.variableName;
    this._loopObject = parsed.object;
  }
}
class BinderManipulatorRepeaterFactory {
  static produce(repeaterType: string): BinderManipulatorRepeater {
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
      // let element = this._owner.element.cloneNode(true);
      let newBinderNode = this._owner.replicateOriginal();
      newBinderNode.isManipulable = false;
      let variableIndex = new BinderVariable(i, null, "$index");
      newBinderNode.binderScope.registerVariable(variableIndex);
      BinderTools.addSiblingAfter((this._repeatedElements[this._repeatedElements.length - 1] || this._owner).element, newBinderNode.element);
      // newBinderNode.updateTree();
      newBinderNode.manipulate(true);
      this._repeatedElements.push(newBinderNode);
    }
  }
}