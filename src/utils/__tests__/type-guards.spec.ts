/**
 * Type Guards Test Suite
 * Comprehensive tests for all type guard utilities
 */

import {
  isObject,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isFunction,
  hasMessage,
  hasCode,
  hasName,
  getErrorMessage,
  isValidUrl,
  isValidEmail,
  isNonEmptyString,
  isPositiveNumber,
  isHTMLElement,
  isEvent,
} from '../type-guards';

describe('Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject({ nested: { obj: true } })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
      expect(isString('123')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b'])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction('function')).toBe(false);
      expect(isFunction(null)).toBe(false);
    });
  });

  describe('hasMessage', () => {
    it('should return true for objects with message property', () => {
      expect(hasMessage({ message: 'error' })).toBe(true);
      expect(hasMessage(new Error('test'))).toBe(true);
    });

    it('should return false for objects without message', () => {
      expect(hasMessage({})).toBe(false);
      expect(hasMessage({ error: 'test' })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasMessage(null)).toBe(false);
      expect(hasMessage('message')).toBe(false);
    });

    it('should return false if message is not a string', () => {
      expect(hasMessage({ message: 123 })).toBe(false);
    });
  });

  describe('hasCode', () => {
    it('should return true for objects with code property', () => {
      expect(hasCode({ code: 'ERROR_CODE' })).toBe(true);
      expect(hasCode({ code: 500 })).toBe(true);
    });

    it('should return false for objects without code', () => {
      expect(hasCode({})).toBe(false);
      expect(hasCode({ error: 'test' })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasCode(null)).toBe(false);
      expect(hasCode('code')).toBe(false);
    });
  });

  describe('hasName', () => {
    it('should return true for objects with name property', () => {
      expect(hasName({ name: 'TestError' })).toBe(true);
      expect(hasName(new Error('test'))).toBe(true);
    });

    it('should return false for objects without name', () => {
      expect(hasName({})).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasName(null)).toBe(false);
      expect(hasName('name')).toBe(false);
    });

    it('should return false if name is not a string', () => {
      expect(hasName({ name: 123 })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return string errors directly', () => {
      expect(getErrorMessage('Direct error message')).toBe('Direct error message');
    });

    it('should extract message from Error instances', () => {
      expect(getErrorMessage(new Error('Error message'))).toBe('Error message');
    });

    it('should extract message from objects with message property', () => {
      expect(getErrorMessage({ message: 'Object message' })).toBe('Object message');
    });

    it('should extract nested error message', () => {
      expect(getErrorMessage({ error: { message: 'Nested message' } })).toBe('Nested message');
    });

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
      expect(getErrorMessage({})).toBe('An unknown error occurred');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(123)).toBe(false);
      expect(isValidUrl({})).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('not an email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  content  ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
      expect(isPositiveNumber(Infinity)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('1')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('isHTMLElement', () => {
    it('should return true for HTMLElement instances', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      expect(isHTMLElement(div)).toBe(true);
      expect(isHTMLElement(span)).toBe(true);
    });

    it('should return false for non-HTMLElement values', () => {
      expect(isHTMLElement(null)).toBe(false);
      expect(isHTMLElement({})).toBe(false);
      expect(isHTMLElement('div')).toBe(false);
    });
  });

  describe('isEvent', () => {
    it('should return true for Event instances', () => {
      const event = new Event('click');
      expect(isEvent(event)).toBe(true);
    });

    it('should return false for non-Event values', () => {
      expect(isEvent(null)).toBe(false);
      expect(isEvent({})).toBe(false);
      expect(isEvent('click')).toBe(false);
    });
  });
});
