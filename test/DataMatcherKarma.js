
describe('DataMatcher', () => {

  var DataMatcherInstance,
    settings, data;

  beforeEach(() => {
    DataMatcher.clean();
    settings = {

    };
    data = {
      string: 'some value',
      number: 1,
      object: {
        k1: 1,
        k2: 2,
        object2: {
          k3: 3
        }
      }
    };
    DataMatcher.getInstance(new BinderSettings(settings, data));
  });

  describe('getInstance', () => {

    it('should keep single instance', () => {
      let DataMatcher1 = DataMatcher.getInstance(new BinderSettings(settings, data));
      expect(DataMatcher1._settings.settings.data.number).toBe(1);
      let DataMatcher2 = DataMatcher.getInstance();
      expect(DataMatcher2._settings.settings.data.number).toBe(1);
    });

  });

  describe('getValue', () => {

    it('should return value of 1st level', () => {
      expect(DataMatcher.getInstance().getValue("string")).toBe("some value");
    });

    it('should return existing value for a dot separated key', () => {
      expect(DataMatcher.getInstance().getValue("object.object2.k3")).toBe(3);
    });

    it('should return undefined if filed does not exists', () => {
      expect(DataMatcher.getInstance().getValue("object.noSuchObject")).toBeUndefined()
      expect(DataMatcher.getInstance().getValue("object.noSuchObject.nonExistingKey")).toBeUndefined()
    });

  });

  describe('setValue', () => {

    it('should change existing element\'s value', () => {
      DataMatcher.getInstance().setValue("number", 2);
      expect(DataMatcher.getInstance().getValue("number")).toBe(2);
      expect(DataMatcher.getInstance()._settings.settings.data.number).toBe(2);
      expect(data.number).toBe(2);
    });

    it('should create non existing element and set its value', () => {
      DataMatcher.getInstance().setValue("object.newField.k1", "value1");
      expect(DataMatcher.getInstance().getValue("object.newField.k1")).toBe("value1");
      expect(DataMatcher.getInstance()._settings.settings.data.object.newField.k1).toBe("value1");
      expect(data.object.newField.k1).toBe("value1");
    });

  });

});
