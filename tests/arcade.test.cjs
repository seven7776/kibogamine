// Run with: node tests/arcade.test.cjs (no dependencies).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../arcade.js'), 'utf8'), ctx);
const game = ctx.window.BearArcade;
const state = game.normalize();
assert.equal(game.totalStars(state), 0);
assert.equal(game.rating(0, 7, 1), 1);
assert.equal(game.rating(7, 7, 2), 2);
assert.equal(game.rating(7, 7, 3), 3);
assert.equal(game.recordResult(state, 0, 7, 3).delta, 3);
assert.equal(game.recordResult(state, 0, 10, 3).delta, 0);
assert.equal(game.recordResult(state, 0, 1, 1).delta, 0);
assert.equal(state.records[0].stars, 3);
assert.equal(state.records[0].score, 10);
assert.equal(game.normalize({ trail: 3 }).trail, 0);
const restored = game.normalize(JSON.parse(JSON.stringify(state)));
assert.equal(game.totalStars(restored), 3);
assert.equal(restored.records[0].score, 10);
for (let index = 0; index < game.LEVELS.length; index++) {
  const rows = game.waves(index);
  assert.ok(rows.length > 8);
  assert.ok(rows.reduce((sum, row) => sum + row.items.filter(item => item.type === 'star').length, 0) >= game.LEVELS[index].goal);
  rows.forEach(row => {
    const walls = row.items.filter(item => item.type === 'block' || item.type === 'moving');
    assert.ok(new Set(walls.map(item => item.lane)).size < 3, 'Every wall wave must allow a way around');
  });
}
console.log('PASS: star ratings, best score preservation, no duplicate reward, save restore, trail lock, six course layouts');
