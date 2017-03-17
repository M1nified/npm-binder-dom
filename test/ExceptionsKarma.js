
describe('BinderException', () => {

  describe('General Exception', () => {

    it('should create BinderException object with no params given', () => {
      let ex = new BinderException();
      expect(ex.code).toBeUndefined();
      expect(ex.message).toBeUndefined();
      expect(ex.name).toBe("BinderException");
    });

    it('should create BinderException object with a given code', () => {
      let ex = new BinderException(42);
      expect(ex.code).toBe(42);
      expect(ex.message).toBeUndefined();
      expect(ex.name).toBe("BinderException");
    });

    it('should create BinderException object with given code and message', () => {
      let ex = new BinderException(100, "An error occured!");
      expect(ex.code).toBe(100);
      expect(ex.message).toBe("An error occured!");
      expect(ex.name).toBe("BinderException");
    });

    it('should create BinderException object with given message instead of a code', () => {
      let ex = new BinderException("Another exception!");
      expect(ex.code).toBeUndefined();
      expect(ex.message).toBe("Another exception!");
      expect(ex.name).toBe("BinderException");
    });

  });

  describe('ApplyElementNotSupportedBinderException', () => {

    it('should create exception and give it a name after class name', () => {
      let ex = new ApplyElementNotSupportedBinderException();
      expect(ex.name).toBe("ApplyElementNotSupportedBinderException");
    });

  });

});
