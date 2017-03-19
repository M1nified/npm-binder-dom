class BinderTools {
  static addSiblingAfter(baseNode: Node, newNode: Node) {
    let allNodes = [...baseNode.parentNode.childNodes].filter(node => !Object.is(Node.TEXT_NODE, node.nodeType));
    let indexOfbaseNode = allNodes.indexOf(baseNode)
    if (indexOfbaseNode === allNodes.length) {
      baseNode.parentElement.appendChild(newNode);
    } else {
      baseNode.parentElement.insertBefore(newNode, baseNode.nextSibling);
    }

  }
}