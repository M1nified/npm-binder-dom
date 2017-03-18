class BinderHash {
  private static _instance: BinderHash;

  private _generator: IterableIterator<number>;
  private _lastHash: number = null;
  private _hashMap: { [key: string]: BinderNode } = {};

  get hashMap() {
    return this._hashMap;
  }

  private constructor() {
    this._generator = this.hashCountGenerator();
  }

  static getInstance(): BinderHash {
    if (!BinderHash._instance) {
      BinderHash._instance = new BinderHash();
    }
    return BinderHash._instance;
  }

  next(): string {
    return "binderHash:" + this._generator.next().value;
  }

  linkNode(node: Node, binderNode: BinderNode) {
    let hash = this.next();
    node.binderHash = hash;
    this._hashMap[hash] = binderNode;
  }

  getBinderNode(node: Node | string): BinderNode {
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