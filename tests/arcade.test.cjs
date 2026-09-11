// Run with: node tests/arcade.test.cjs (no dependencies).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../arcade-world.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../arcade.js'), 'utf8'), ctx);
const game = ctx.window.BearArcade;
assert.equal(game.travel(5,35,2,0),5);
assert.equal(game.travel(5,35,2,-0.6),3.8);
assert.equal(game.travel(1,35,10,-0.6),0);
assert.equal(game.travel(5,35,2,1.5),8);
assert.equal(game.travel(34,35,2,1.5),35);
assert.equal(game.LEVELS.length, 20);
assert.equal(ctx.window.ArcadeWorld.BIOMES.length, 5);
assert.equal(new Set(ctx.window.ArcadeWorld.REWARDS.map(r => r[0])).size, 20);
const legacy = game.normalize({records: Array.from({length: 6}, (_, i) => ({stars: i === 4 ? 2 : 0, score: i === 4 ? 15 : 0}))});
assert.equal(legacy.records[4].stars, 2);
assert.equal(legacy.records[4].score, 15);
assert.equal(legacy.records[19].stars, 0);
assert.equal(game.cleared(legacy), 5);
assert.ok(game.canEnter(legacy, 5));
assert.ok(!game.canEnter(legacy, 6));
assert.equal(game.recordResult(legacy, 0, 7, 3).upgrade, false);
assert.equal(game.recordResult(legacy, 5, 20, 3).upgrade, true);
assert.equal(game.recordResult(legacy, 5, 20, 3).upgrade, false);
assert.ok(game.canEnter(legacy, 6));
for (let i = 1; i < 20; i++) {
  assert.ok(game.LEVELS[i].speed > game.LEVELS[i - 1].speed);
  assert.ok(game.LEVELS[i].spacing < game.LEVELS[i - 1].spacing);
}
const complete = game.normalize();
game.LEVELS.forEach((level, index) => game.recordResult(complete, index, level.goal, 3));
assert.equal(game.totalStars(complete), 60);
assert.equal(game.cleared(complete), 20);
assert.ok(!game.canEnter(complete, 20));
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
console.log('PASS: star ratings, best score preservation, no duplicate reward, save restore, trail lock, twenty course layouts');
