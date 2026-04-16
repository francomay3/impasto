import { describe, expect, it } from 'vitest';
import { repositionUpdatesForPointerImageDelta } from './colorPinImageDrag';

describe('repositionUpdatesForPointerImageDelta', () => {
  it('applies the same delta to every pin and clamps per pin', () => {
    const startById = new Map([
      ['a', { x: 1, y: 1 }],
      ['b', { x: 8, y: 2 }],
    ]);
    const updates = repositionUpdatesForPointerImageDelta(
      { x: 0, y: 0 },
      { x: 2, y: -1 },
      ['a', 'b'],
      startById,
      10,
      10,
    );
    const byId = new Map(updates.map((u) => [u.id, u]));
    expect(byId.get('a')).toEqual({ id: 'a', imageX: 3, imageY: 0 });
    expect(byId.get('b')!.imageX).toBeLessThan(10);
    expect(byId.get('b')!.imageY).toBe(1);
  });

  it('skips unknown ids', () => {
    const startById = new Map([['a', { x: 0, y: 0 }]]);
    expect(
      repositionUpdatesForPointerImageDelta({ x: 0, y: 0 }, { x: 0, y: 0 }, ['a', 'missing'], startById, 5, 5),
    ).toEqual([{ id: 'a', imageX: 0, imageY: 0 }]);
  });
});
