
describe('Binder', () => {

  var binderInstance,
    settings;

  beforeEach(() => {
    Binder.clean();
    settings = {
      data: {
        string: 'some value',
        number: 1,
        object: {
          k1: 1,
          k2: 2,
          object2: {
            k3: 3
          }
        }
      }
    };
    Binder.getInstance(settings);
  });

  describe('getInstance', () => {

    it('should keep single instance', () => {
      let binder1 = Binder.getInstance(settings);
      expect(binder1._settings.data.number).toBe(1);
      let binder2 = Binder.getInstance();
      expect(binder2._settings.data.number).toBe(1);
    });

  });

  describe('getValue', () => {

    it('should return value of 1st level', () => {
      expect(Binder.getInstance().getValue("string")).toBe("some value");
    });

    it('should return existing value for a dot separated key', () => {
      expect(Binder.getInstance().getValue("object.object2.k3")).toBe(3);
    });

    it('should return undefined if filed does not exists', () => {
      expect(Binder.getInstance().getValue("object.noSuchObject")).toBeUndefined()
      expect(Binder.getInstance().getValue("object.noSuchObject.nonExistingKey")).toBeUndefined()
    });

  });

  describe('setValue', () => {

    it('should change existing element\'s value', () => {
      Binder.getInstance().setValue("number", 2);
      expect(Binder.getInstance().getValue("number")).toBe(2);
      expect(Binder.getInstance()._settings.data.number).toBe(2);
      expect(settings.data.number).toBe(2);
    });

    it('should create non existing element and set its value', () => {
      Binder.getInstance().setValue("object.newField.k1","value1");
      expect(Binder.getInstance().getValue("object.newField.k1")).toBe("value1");
      expect(Binder.getInstance()._settings.data.object.newField.k1).toBe("value1");
      expect(settings.data.object.newField.k1).toBe("value1");
    });

  });

});
