
import { cn } from './utils';

describe('cn', () => {
  it('should merge classes correctly', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('should handle conflicting classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should handle conditional classes', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });

  it('should handle no arguments', () => {
    expect(cn()).toBe('');
  });

  it('should handle falsy values', () => {
    expect(cn(null, undefined, false, 'a')).toBe('a');
  });
});
