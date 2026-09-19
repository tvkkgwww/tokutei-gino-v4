(()=>{'use strict';
const VERSION='7.2.4',$=id=>document.getElementById(id);let registration=null,waiting=null;
function version(){document.querySelector('meta[name="tg-app-version"]')?.setAttribute('content',VERSION);window.TG_APP_VERSION=VERSION;['updateStatus','directStatus510','status590'].forEach(id=>{if($(id))$(id).textContent='Phiên bản hiện tại: v'+VERSION})}
function panel(){
  let box=$('ginoPwa724');if(box)return box;
  const host=$('settingsView')?.querySelector('.panel');if(!host)return null;
  box=document.createElement('section');box.id='ginoPwa724';box.innerHTML='<h3>📱 Ứng dụng trên thiết bị</h3><p id="ginoPwaStatus724" class="wait">Đang kiểm tra dữ liệu offline…</p><p id="ginoPwaInstallHint724">Trên iPhone/iPad: mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính.</p><button id="ginoPwaUpdate724">Kiểm tra cập nhật</button>';
  host.appendChild(box);$('ginoPwaUpdate724').onclick=check;return box;
}
function paint(text,ready=false){panel();const n=$('ginoPwaStatus724');if(n){n.className=ready?'ready':'wait';n.textContent=text}}
async function offlineStatus(){
  if(!registration?.active)return paint('Chưa hoàn tất lưu dữ liệu. Hãy giữ mạng và tải lại trang một lần.');
  const channel=new MessageChannel();const reply=new Promise(resolve=>{channel.port1.onmessage=e=>resolve(e.data);setTimeout(()=>resolve(null),2500)});
  registration.active.postMessage({type:'GET_OFFLINE_STATUS'},[channel.port2]);const s=await reply;
  if(s?.ready)paint('✓ Sẵn sàng mở ứng dụng khi mất mạng ('+s.cached+'/'+s.total+' tệp)',true);
  else paint('Đang lưu dữ liệu offline… '+(s?.cached||0)+'/'+(s?.total||12));
}
async function check(){
  if(!registration)return paint('Trình duyệt này chưa bật bộ nhớ offline.');
  paint('Đang kiểm tra bản mới…');try{await registration.update();setTimeout(()=>waiting?paint('Có bản mới — bấm lại nút để cập nhật.'):offlineStatus(),600)}catch(_){paint('Không kiểm tra được khi đang offline.')}
  if(waiting){waiting.postMessage({type:'SKIP_WAITING'});paint('Đang cập nhật…');}
}
function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){waiting=worker;paint('Có bản mới — bấm “Kiểm tra cập nhật” để áp dụng.')}})}
async function boot(){
  version();panel();if(!('serviceWorker'in navigator)||!window.isSecureContext)return paint('Offline cần mở từ địa chỉ HTTPS.');
  try{registration=await navigator.serviceWorker.register('./sw.js?pwa='+VERSION,{scope:'./',updateViaCache:'none'});waiting=registration.waiting;watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));navigator.serviceWorker.addEventListener('message',e=>{const d=e.data;if(d?.type==='INSTALL_PROGRESS')paint('Đang lưu dữ liệu offline… '+d.cached+'/'+d.total);if(d?.type==='OFFLINE_STATUS')paint(d.ready?'✓ Sẵn sàng mở khi mất mạng':'Đang lưu dữ liệu offline…',!!d.ready)});navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());await registration.update();await offlineStatus()}catch(error){console.error('Gino2 PWA',error);paint('Chưa lưu được dữ liệu offline. Hãy kiểm tra các tệp đã tải lên.')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.GinoPWA={ready:offlineStatus,check};
})();
