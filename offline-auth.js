/* Gino2 v7.2.4: device-local verifier for an account approved online once. */
(()=>{'use strict';
const enc=new TextEncoder(),$=id=>document.getElementById(id);
const key=email=>'gino724_offline_auth:'+String(email||'').trim().toLowerCase();
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(password,salt){
  const base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,256));
}
async function save(email,password,profile){
  if(!email||!password||!profile)return;
  const salt=crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(key(email),JSON.stringify({email:String(email).toLowerCase(),salt:b64(salt),hash:await derive(password,salt),profile,verifiedAt:Date.now(),v:2}));
}
async function verify(email,password){
  let x=null;try{x=JSON.parse(localStorage.getItem(key(email))||'null')}catch(_){return null}
  if(!x?.salt||!x?.hash||!x?.profile)return null;
  return await derive(password,ub64(x.salt))===x.hash?x:null;
}
function access(profile){
  let list=profile?.course_permissions||[];
  if(list&&!Array.isArray(list)&&typeof list==='object')list=Object.keys(list).filter(k=>list[k]===true);
  list=(list||[]).map(x=>String(x).toUpperCase().replace('GINOU2','GINO2'));
  if(String(profile?.role||'').toLowerCase()==='admin')list=['N5','N4','N3','N2','N1','GINO2'];
  return list;
}
function enter(email,profile){
  if(profile?.account_enabled===false||profile?.approved===false)throw Error('Tài khoản chưa được phép đăng nhập offline.');
  const admin=String(profile?.role||'student').toLowerCase()==='admin',allowed=access(profile);
  window.ginoCloudProfile=profile;window.ginoCloudEmail=email;window.currentUser=admin?'admin':email;
  try{currentUser=window.currentUser}catch(_){}
  localStorage.setItem('tg_current_role',admin?'admin':'student');
  if(admin){sessionStorage.setItem('tg_admin_verified_session','1');localStorage.setItem('tg_admin_access',JSON.stringify(allowed))}
  else {try{const users=JSON.parse(localStorage.getItem('tg_users')||'{}');users[email]={...(users[email]||{}),name:profile.display_name||email,email,username:profile.username||'',status:'approved',access:allowed,cloud_uid:profile.id,cloud_role:profile.role||'student'};localStorage.setItem('tg_users',JSON.stringify(users))}catch(_){}}
  sessionStorage.setItem('gino720_active','1');$('login')?.classList.add('hidden');$('app')?.classList.remove('hidden');
  try{show('homeView','Khóa học')}catch(_){}
  const cloud=$('tgCloudStatus702');if(cloud){cloud.className='tg-offline';cloud.textContent='☁️ OFFLINE · Đăng nhập bằng dữ liệu an toàn trên máy ✓'}
  try{toast('Đăng nhập offline thành công')}catch(_){}
}
window.GinoOffline={onlineVerified:save,verify};
// Registered in <head>, before legacy login handlers, so offline login cannot be intercepted.
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('#loginBtn');if(!button||navigator.onLine)return;
  const email=String($('user')?.value||'').trim().toLowerCase(),password=$('pass')?.value||'';
  if(!email.includes('@'))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  try{
    if(!password)throw Error('Hãy nhập mật khẩu.');
    const saved=await verify(email,password);
    if(!saved)throw Error('Máy này chưa lưu tài khoản hoặc mật khẩu không đúng. Hãy đăng nhập online thành công một lần trước.');
    enter(email,saved.profile);
  }catch(error){try{toast(error.message)}catch(_){alert(error.message)}}
},true);
})();
