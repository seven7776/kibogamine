/* Shared, testable helpers for dates, course navigation and safe backup import. */
(function () {
  'use strict';
  function dayKey(value) {
    var d = value instanceof Date ? value : new Date(value === undefined ? Date.now() : value);
    if (!Number.isFinite(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function streak(log, id, today) {
    var date = new Date(today || Date.now()), count = 0;
    if (!(log[dayKey(date)] || {})[id]) date.setDate(date.getDate() - 1);
    for (var i = 0; i < 3660; i++) {
      if (!(log[dayKey(date)] || {})[id]) break;
      count++; date.setDate(date.getDate() - 1);
    }
    return count;
  }
  function minutes(value) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    var p = value.split(':'); return Number(p[0]) * 60 + Number(p[1]);
  }
  function extraError(ex, entries, skip) {
    if (!ex.name.trim()) return '先填课外班名称';
    if (!Number.isInteger(ex.dow) || ex.dow < 1 || ex.dow > 7) return '请选择星期';
    var start = minutes(ex.start), end = minutes(ex.end);
    if (start === null || end === null) return '请填写开始和结束时间，例如 18:30';
    if (end <= start) return '结束时间要晚于开始时间';
    var clash = entries.find(function (other, i) {
      return i !== skip && Number(other.dow) === ex.dow && minutes(other.start) !== null && minutes(other.end) !== null && start < minutes(other.end) && end > minutes(other.start);
    });
    return clash ? '与「' + clash.name + '」时间重叠，请调整后保存' : '';
  }
  function lessonLink(curriculum, id) {
    var result = null;
    Object.keys(curriculum).some(function (key) {
      return (curriculum[key].units || []).some(function (unit) {
        return unit.lessons.some(function (lesson) {
          if (lesson.id !== id || lesson.skeleton) return false;
          result = { title: lesson.title, subject: curriculum[key].name, href: '#/lesson/' + key + '/' + id }; return true;
        });
      });
    });
    return result;
  }
  function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function restore(data, defaults) {
    if (!object(data) || !object(data.pet) || !object(data.schedule) || !object(data.schedule.grid)) throw Error('备份缺少萌宠或课表数据');
    if (!Number.isFinite(data.points) || data.points < 0) throw Error('备份中的奖章数不正确');
    for (var d = 1; d <= 5; d++) if (!Array.isArray(data.schedule.grid[d]) || !data.schedule.grid[d].every(function (v) { return typeof v === 'string'; })) throw Error('备份中的课表格式不正确');
    if (!Array.isArray(data.pet.owned) || !data.pet.owned.every(function (v) { return typeof v === 'string'; })) throw Error('备份中的皮肤记录不正确');
    if (data.study && (!object(data.study) || !Object.keys(data.study).every(function (id) { return object(data.study[id]) && (!data.study[id].tasks || object(data.study[id].tasks)); }))) throw Error('备份中的学习记录格式不正确');
    if (data.checkins && (!object(data.checkins) || !Array.isArray(data.checkins.items) || !data.checkins.items.every(function (it) { return object(it) && typeof it.id === 'string' && typeof it.name === 'string' && typeof it.icon === 'string' && Number.isFinite(it.points) && it.points >= 0; }) || !object(data.checkins.log))) throw Error('备份中的打卡记录格式不正确');
    if (data.schedule.extra && (!Array.isArray(data.schedule.extra) || !data.schedule.extra.every(function (ex) { return object(ex) && typeof ex.name === 'string' && Number(ex.dow) >= 1 && Number(ex.dow) <= 7; }))) throw Error('备份中的课外班格式不正确');
    var next = Object.assign({}, defaults, data);
    next.pet = Object.assign({}, defaults.pet, data.pet);
    ['hunger','thirst','mood','energy','xp'].forEach(function (key) { if (!Number.isFinite(next.pet[key]) || next.pet[key] < 0) throw Error('备份中的萌宠状态不正确'); });
    next.schedule = Object.assign({}, defaults.schedule, data.schedule);
    next.counters = Object.assign({}, defaults.counters, data.counters || {});
    next.study = Object.assign({}, data.study || {});
    Object.keys(next.study).forEach(function (id) { next.study[id] = Object.assign({ tasks: {} }, next.study[id]); });
    return next;
  }
  window.AppTools = { dayKey: dayKey, streak: streak, minutes: minutes, extraError: extraError, lessonLink: lessonLink, restore: restore };
})();
