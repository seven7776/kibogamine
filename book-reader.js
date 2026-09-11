/* Read already imported textbook pages without silently mixing lesson editions. */
(function () {
  'use strict';
  var MAP_KEY='kibogamine-book-bindings-v1';
  function bindings(){try{var value=JSON.parse(localStorage.getItem(MAP_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(e){return {};}}
  function mount(options){
    var host=options.host,ab=options.lid.slice(0,2),serial=0;
    host.innerHTML='<div class="section-title">本地课本图片</div><div class="book-reader card"><p class="hint" id="reader-status">正在检查本机课本…</p><div id="reader-pages"></div><div class="book-controls" hidden><button class="btn ghost" id="reader-prev">上一页</button><select id="reader-select" aria-label="选择本地课本页"></select><button class="btn ghost" id="reader-next">下一页</button></div><button class="btn ghost" id="reader-bind" hidden>把这一页设为本课首页</button><button class="btn ghost" id="reader-import">导入课本图片</button></div>';
    var q=function(s){return host.querySelector(s);},status=q('#reader-status'),images=q('#reader-pages');
    q('#reader-import').onclick=options.import;
    function paint(srcs){images.replaceChildren();srcs.forEach(function(src,i){if(typeof src!=='string'||!/^data:image\//.test(src))return;var img=document.createElement('img');img.src=src;img.alt='本地课本图片 '+(i+1);img.loading=i?'lazy':'eager';img.onclick=function(){img.classList.toggle('zoomed');};images.append(img);});}
    options.get(options.lid,function(photo){
      if(!host.isConnected)return;
      if(photo&&photo.imgs&&photo.imgs.length){paint(photo.imgs);status.textContent='本课本机照片 · '+photo.imgs.length+'页'+(photo.lessonTitle===options.title?'':' · 请核对图片课名与当前课文一致');q('#reader-import').textContent='补充课本图片';return;}
      options.keys(function(keys){
        if(!host.isConnected)return;
        var pages=keys.filter(function(k){return typeof k==='string'&&k.indexOf(ab+':')===0&&/^\d+$/.test(k.slice(3));}).map(function(k){return {key:k,page:Number(k.slice(3))};}).sort(function(a,b){return a.page-b.page;});
        if(!pages.length){status.textContent='这台设备还没有导入这册课本图片。'+(ab==='yw'?'语文第一课应为《桂花雨》，请核对课本版本。':'')+'可以先拍照保存本课，再导入相同版本的整册图片。';return;}
        var selected=0,saved=bindings()[options.lid];
        if(saved&&saved.title===options.title){var found=pages.findIndex(function(p){return p.key===saved.key;});if(found>=0)selected=found;}
        // Legacy mappings are safe only for subjects whose course tree was not replaced.
        else if(ab==='kx'||ab==='dd'){var legacy=pages.findIndex(function(p){return p.page===options.legacyPage;});if(legacy>=0)selected=legacy;}
        var select=q('#reader-select');pages.forEach(function(p){var option=document.createElement('option');option.value=p.key;option.textContent='图片序号 '+p.page;select.append(option);});
        q('.book-controls').hidden=false;q('#reader-bind').hidden=false;
        function show(index){
          selected=Math.max(0,Math.min(pages.length-1,index));var page=pages[selected],request=++serial;select.value=page.key;
          q('#reader-prev').disabled=selected===0;q('#reader-next').disabled=selected===pages.length-1;
          status.textContent='读取图片…';
          options.get(page.key,function(record){if(!host.isConnected||request!==serial)return;if(!record||!record.imgs||!record.imgs.length){images.replaceChildren();status.textContent='这页图片未成功导入，请重新选择原图导入';return;}
            paint(record.imgs);var current=bindings()[options.lid],matched=current&&current.title===options.title&&current.key===page.key;
            status.textContent='本机共 '+pages.length+' 张 · 当前图片序号 '+page.page+'（与书上印刷页码可能不同） · '+(matched?'已设为本课首页':'请核对课名；翻到对应页后可设为本课首页');
          });
        }
        select.onchange=function(){show(pages.findIndex(function(p){return p.key===select.value;}));};q('#reader-prev').onclick=function(){show(selected-1);};q('#reader-next').onclick=function(){show(selected+1);};
        q('#reader-bind').onclick=function(){var map=bindings();map[options.lid]={title:options.title,key:pages[selected].key};try{localStorage.setItem(MAP_KEY,JSON.stringify(map));status.textContent='已记住本课首页，下次打开课文直接显示这一页';}catch(e){status.textContent='页码未能保存，请检查本机存储空间';}};
        show(selected);
      });
    });
  }
  window.LocalBookReader={mount:mount};
})();
