/* Private practice records. Media stays in this browser and is never sent to a server. */
(function () {
  'use strict';
  var active = null, dbPromise;
  function db() {
    if (!dbPromise) dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open('kibogamine-practice', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('entries', { keyPath: 'id' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { dbPromise = null; reject(Error('无法打开本机记录，请检查浏览器存储权限')); };
    });
    return dbPromise;
  }
  function transaction(mode, action) {
    return db().then(function (database) { return new Promise(function (resolve, reject) {
      var tx = database.transaction('entries', mode), req = action(tx.objectStore('entries'));
      tx.oncomplete = function () { resolve(req && req.result); };
      tx.onerror = tx.onabort = function () { reject(Error('保存失败，可能是本机空间不足；原记录仍保留')); };
    }); });
  }
  function get(id) { return transaction('readonly', function (store) { return store.get(id); }); }
  function all() { return transaction('readonly', function (store) { return store.getAll(); }); }
  function close() { if (active) active(); }
  function history() {
    close();
    var mask=document.createElement('div'),disposed=false;
    mask.className='modal-mask journal-mask';mask.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="journal-history-title"><h3 id="journal-history-title">练习记录本</h3><p class="hint">这里保存学习和打卡留下的过程，可打开旧记录继续补充。</p><div id="journal-history">读取中…</div><div class="btn-row"><button class="btn" id="history-close">返回</button></div></section>';
    document.body.appendChild(mask);
    function cleanup(){disposed=true;mask.remove();document.removeEventListener('keydown',key);active=null;}
    function key(e){if(e.key==='Escape')cleanup();}
    active=cleanup;document.addEventListener('keydown',key);mask.querySelector('#history-close').onclick=cleanup;mask.querySelector('#history-close').focus();
    all().then(function(entries){if(disposed)return;var list=mask.querySelector('#journal-history');list.textContent=entries.length?'':'还没有练习记录。在课文或打卡项目里点“练习记录”即可保存。';entries.sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt));}).forEach(function(entry){var button=document.createElement('button');button.className='journal-history-item btn ghost';var name=document.createElement('b'),note=document.createElement('small');name.textContent=entry.title||'练习记录';note.textContent=(entry.note||'').slice(0,70)+' · '+entry.files.length+' 个附件';button.append(name,note);button.onclick=function(){open({id:entry.id,title:entry.title||'练习记录'});};list.append(button);});}).catch(function(e){if(!disposed)mask.querySelector('#journal-history').textContent=e.message;});
  }
  function open(options) {
    close();
    var mask = document.createElement('div'), urls = [], files = [], loaded = false, disposed = false;
    mask.className = 'modal-mask journal-mask';
    mask.innerHTML = '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="journal-title"><h3 id="journal-title"></h3><p class="hint">留下练习的过程：文字、作业照片、跟读录音或练习视频均可。只存本机，不会自动判分或额外发奖。</p><label>练了什么<textarea id="journal-note" maxlength="2000" rows="3" placeholder="例如：练琴20分钟，慢练了第二段"></textarea></label><label>用时（分钟，可不填）<input id="journal-minutes" type="number" min="0" max="600" inputmode="numeric"></label><label class="btn ghost journal-attach">添加照片 / 音频 / 视频<input id="journal-files" type="file" accept="image/*,audio/*,video/*" multiple></label><p class="hint">最多3个附件，每个不超过20MB，合计不超过40MB。可以选择系统录好的音频和视频。</p><div id="journal-media"></div><p id="journal-status" role="status">正在读取…</p><div class="btn-row"><button class="btn ghost" id="journal-close">返回</button><button class="btn" id="journal-save" disabled>保存记录</button></div></section>';
    document.body.appendChild(mask);
    var query = function (s) { return mask.querySelector(s); }, previousFocus = document.activeElement;
    query('h3').textContent = options.title;
    function cleanup() { disposed = true; urls.forEach(URL.revokeObjectURL); mask.querySelectorAll('audio,video').forEach(function (m) { m.pause(); }); mask.remove(); document.removeEventListener('keydown', keydown); active = null; if (previousFocus && previousFocus.isConnected) previousFocus.focus(); }
    function keydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
      if (e.key === 'Tab') { var nodes = Array.from(mask.querySelectorAll('button:not(:disabled),textarea,input')); var first=nodes[0], last=nodes[nodes.length-1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    active = cleanup; document.addEventListener('keydown', keydown);
    query('#journal-close').onclick = cleanup;
    function paint() {
      urls.forEach(URL.revokeObjectURL); urls = [];
      var container = query('#journal-media'); container.querySelectorAll('audio,video').forEach(function (m) { m.pause(); }); container.replaceChildren();
      files.forEach(function (file, i) {
        var row = document.createElement('div'), name = document.createElement('span'), remove = document.createElement('button'); row.className = 'journal-file';
        var kind = file.type.split('/')[0], media = document.createElement(kind === 'image' ? 'img' : kind), url = URL.createObjectURL(file.blob); urls.push(url);
        media.src = url; if (kind === 'image') media.alt = file.name; else { media.controls = true; media.preload = 'metadata'; }
        name.textContent = file.name; remove.textContent = '移除'; remove.className = 'btn ghost'; remove.onclick = function () { files.splice(i,1); paint(); };
        row.append(media,name,remove); container.append(row);
      });
    }
    query('#journal-files').onchange = function (event) {
      var picked = Array.from(event.target.files || []); event.target.value = '';
      if (!loaded) return;
      if (files.length + picked.length > 3 || picked.some(function (f) { return !/^(image|audio|video)\//.test(f.type) || f.size > 20*1024*1024; }) || files.concat(picked.map(function (f) { return {blob:f}; })).reduce(function (n,f) { return n+f.blob.size; },0) > 40*1024*1024) { query('#journal-status').textContent = '请选择照片、音频或视频，并检查数量和大小限制'; return; }
      picked.forEach(function (f) { files.push({name:f.name,type:f.type,blob:f}); }); paint(); query('#journal-status').textContent = '附件已选择，点保存后才会存入本机';
    };
    query('#journal-save').onclick = function () {
      var minutes = query('#journal-minutes').value, note = query('#journal-note').value.trim();
      if (minutes !== '' && (!Number.isInteger(Number(minutes)) || Number(minutes)<0 || Number(minutes)>600)) { query('#journal-status').textContent = '用时请填0–600之间的整数'; return; }
      if (!note && !files.length) { query('#journal-status').textContent = '写一句练习记录或添加一个附件再保存'; return; }
      var button = query('#journal-save'); button.disabled = true;
      transaction('readwrite', function (store) { return store.put({id:options.id,title:options.title,note:note,minutes:minutes === ''?null:Number(minutes),files:files,updatedAt:new Date().toISOString()}); }).then(function () { if (!disposed) { query('#journal-status').textContent = '已保存到本机 · 这是练习记录，尚未经核验'; button.disabled = false; } }).catch(function (e) { if (!disposed) { query('#journal-status').textContent=e.message; button.disabled=false; } });
    };
    get(options.id).then(function (entry) { if (disposed) return; if (entry) { query('#journal-note').value=entry.note||''; query('#journal-minutes').value=entry.minutes === null?'':entry.minutes; files=entry.files||[]; paint(); } loaded=true; query('#journal-save').disabled=false; query('#journal-status').textContent=entry?'已载入本机记录 · 可继续补充':'尚无记录'; query('#journal-note').focus(); }).catch(function (e) { if (!disposed) query('#journal-status').textContent=e.message; });
  }
  function downloadBackup() {
    return all().then(async function (entries) {
      var encoded = await Promise.all(entries.map(async function (entry) { return Object.assign({},entry,{files:await Promise.all(entry.files.map(function (file) { return new Promise(function (resolve,reject) { var reader=new FileReader();reader.onload=function(){resolve({name:file.name,type:file.type,data:reader.result});};reader.onerror=reject;reader.readAsDataURL(file.blob); }); }))}); }));
      var blob=new Blob([JSON.stringify({format:'kibogamine-practice-v1',entries:encoded})],{type:'application/json'}), url=URL.createObjectURL(blob), link=document.createElement('a');link.href=url;link.download='希望之峰练习附件备份.json';link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);return entries.length;
    });
  }
  async function importBackup(data) {
    if (!data || data.format !== 'kibogamine-practice-v1' || !Array.isArray(data.entries)) throw Error('不是练习附件备份');
    // Validate every record before beginning the atomic transaction.
    var entries=data.entries.map(function(entry){
      if (!entry || typeof entry.id!=='string' || !/^(lesson|checkin):/.test(entry.id) || typeof entry.note!=='string' || !Array.isArray(entry.files) || entry.files.length>3) throw Error('附件备份格式不正确');
      var files=entry.files.map(function(file){
        if (!file || typeof file.name!=='string' || !/^(image|audio|video)\/[\w.+-]+$/.test(file.type) || typeof file.data!=='string' || !file.data.startsWith('data:'+file.type+';base64,')) throw Error('附件格式不正确');
        var bytes=atob(file.data.split(',')[1]);if(bytes.length>20*1024*1024)throw Error('单个附件超过20MB');var buffer=new Uint8Array(bytes.length);for(var i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i);return {name:file.name,type:file.type,blob:new Blob([buffer],{type:file.type})};
      });
      if(files.reduce(function(n,f){return n+f.blob.size;},0)>40*1024*1024)throw Error('记录附件超过40MB');
      return Object.assign({},entry,{files:files});
    });
    return db().then(function(database){return new Promise(function(resolve,reject){var tx=database.transaction('entries','readwrite'),store=tx.objectStore('entries');entries.forEach(function(entry){store.put(entry);});tx.oncomplete=function(){resolve(entries.length);};tx.onerror=tx.onabort=function(){reject(Error('附件导入失败，原记录仍保留'));};});});
  }
  window.PracticeJournal = { open:open, history:history, close:close, exportBackup:downloadBackup, importBackup:importBackup };
})();
