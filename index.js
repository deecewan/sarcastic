'use strict';
// @flow

/*::
type Assertion<T> = (val: mixed, name: string) => T;
type AssertionMap = { [key: string]: Assertion<any> };
type ExtractAssertionType = <T>(Assertion<T>) => T;
type AssertionResultMap<T> = $ObjMap<T, ExtractAssertionType>;
*/

class AssertionError extends Error {
  /*::
  kind: string;
  target: string;
  value: mixed;
  */

  constructor(kind/*: string */, target/*: string */, value/*: mixed */) {
    super(`${target} must be ${kind}`);
    this.kind = kind;
    this.target = target;
    this.value = value;
  }
}

let is = /*:: <T> */ (val/*: mixed */, assertion/*: Assertion<T> */, name/*: string */)/*: T */ => {
  return assertion(val, name);
};

let boolean /*: Assertion<boolean> */ = (val, name) => {
  if (typeof val === 'boolean') return val;
  throw new AssertionError('a boolean', name, val);
};

let number /*: Assertion<number> */ = (val, name) => {
  if (typeof val === 'number') return val;
  throw new AssertionError('a number', name, val);
};

let string /*: Assertion<string> */ = (val, name) => {
  if (typeof val === 'string') return val;
  throw new AssertionError('a string', name, val);
};

let array /*: Assertion<Array<mixed>> */ = (val, name) => {
  if (Array.isArray(val)) return val;
  throw new AssertionError('an array', name, val);
};

let object /*: Assertion<{ [key: string]: mixed }> */ = (val, name) => {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val;
  throw new AssertionError('an object', name, val);
};

let arrayOf = /*:: <T> */ (assertion /*: Assertion<T> */) /*: Assertion<Array<T>> */ => {
  return (val, name) => {
    return is(val, array, name).map((item, index) => assertion(item, `${name}[${index}]`));
  };
};

let objectOf = /*::<T> */ (assertion/*: Assertion<T>*/)/*: Assertion<{ [key: string]: T }> */ => {
  return (val, name) => {
    let obj = is(val, object, name);
    let res = {};
    Object.keys(obj).forEach(key => {
      res[key] = assertion(obj[key], `${name}.${key}`);
    });
    return res;
  };
};

let shape = /*:: <T: AssertionMap> */ (assertions /*: T */) /*: Assertion<AssertionResultMap<T>> */ => {
  return (val, name) => {
    let obj = is(val, object, name);
    let res = {};
    Object.keys(assertions).forEach(key => {
      res[key] = assertions[key](obj[key], `${name}.${key}`);
    });
    return res;
  };
};

let maybe = /*:: <T> */ (assertion /*: Assertion<T> */) /*: Assertion<T | null> */ => {
  return (val, name) => {
    if (typeof val === 'undefined' || val === null) return null;
    return assertion(val, name);
  };
};

let either = /*:: <A, B> */ (assertionA /*: Assertion<A> */, assertionB /*: Assertion<B> */) /*: Assertion<A | B> */ => {
  return (val, name) => {
    try {
      return assertionA(val, name)
    } catch (errA) {
      if (!(errA instanceof AssertionError)) throw errA;
      try {
        return assertionB(val, name);
      } catch (errB) {
        if (!(errA instanceof AssertionError)) throw errB;
        throw new AssertionError(`${errA.kind} or ${errB.kind}`, name, val);
      }
    }
  };
};

is.is = is;
is.boolean = boolean;
is.number = number;
is.string = string;
is.array = array;
is.object = object;
is.arrayOf = arrayOf;
is.objectOf = objectOf;
is.shape = shape;
is.maybe = maybe;
is.either = either;

module.exports = is;
