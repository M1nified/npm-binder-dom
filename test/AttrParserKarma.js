
describe('AttrParser', () => {

  describe('parseRepeat', () => {

    it('should parse correct strings', () => {
      expect(AttrParser.parseRepeat("element in array")).
        toEqual({
          variableName: "element",
          object: "array",
          iteration: "in"
        });
      expect(AttrParser.parseRepeat("element in [1,2,3,4]")).
        toEqual({
          variableName: "element",
          object: [1, 2, 3, 4],
          iteration: "in"
        });
    });

    it('should throw IncorrectExpressionBinderException', () => {
      let task = () => {
        AttrParser.parseRepeat("element as array");
      }
      expect(task).toThrow(new IncorrectExpressionBinderException(0, "parseRepeat function failed"));
    });

    it('should throw IncorrectExpressionBinderException if failed to parse json', () => {
      try {
        AttrParser.parseRepeat("element in [1,2,3\",4]");
        fail("did NOT throw");
      } catch (exception) {
        expect(exception.code).toBe(2);
        expect(exception.name).toBe("IncorrectExpressionBinderException");
      }
    });

  });

});
