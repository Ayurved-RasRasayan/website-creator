/**
 * blog.js - Blog: auth, threaded comments, reactions, admin moderation.
 */
const Blog={posts:[],apiComments:{},apiLikes:{},apiViews:{},_activeSlug:null,

vid(){let v=localStorage.getItem('blog_vid');if(!v){v=crypto.randomUUID();localStorage.setItem('blog_vid',v);}return v;},

async load(){try{const r=await fetch('/data/blog.json?t='+Date.now());if(r.ok){const d=await r.json();this.posts=d.posts||[];}}catch(e){}
await Promise.all(this.posts.map(async p=>{const s=p.slug;const[cr,lr,vr]=await Promise.allSettled([
fetch('/api/blog/comment?slug='+s+'&vid='+this.vid(),{headers:Auth.authHeaders()}).then(r=>r.ok?r.json():{}),
fetch('/api/blog/like?slug='+s+'&vid='+this.vid()).then(r=>r.ok?r.json():{}),
fetch('/api/blog/views?slug='+s).then(r=>r.ok?r.json():{})]);
if(cr.status==='fulfilled'&&cr.value.comments)this.apiComments[s]=cr.value.comments;
if(lr.status==='fulfilled')this.apiLikes[s]=lr.value;
if(vr.status==='fulfilled')this.apiViews[s]=vr.value.views||0;}));},

getPost(s){return this.posts.find(p=>p.slug===s);},
totalLikes(p){return(p.likes||0)+(this.apiLikes[p.slug]?.count||0);},
allComments(p){const s=(p.comments||[]).map(c=>({...c,isStatic:true,children:[],likes:c.likes||0,dislikes:0,myReaction:null}));return[...(this.apiComments[p.slug]||[]),...s];},
totalViews(p){return(p.views||0)+(this.apiViews[p.slug]||0);},
isLiked(p){return!!this.apiLikes[p.slug]?.liked;},
cc(c){return{'Herbs':{bg:'bg-green-100',text:'text-green-700'},'Resin':{bg:'bg-amber-100',text:'text-amber-700'},'Oils':{bg:'bg-yellow-100',text:'text-yellow-700'},'Seeds':{bg:'bg-lime-100',text:'text-lime-700'}}[c]||{bg:'bg-gray-100',text:'text-gray-700'};},
gr(c){return{amber:'from-amber-400 to-orange-500',green:'from-green-400 to-teal-500',emerald:'from-emerald-400 to-green-500'}[c]||'from-emerald-400 to-green-500';},
fmt(d){return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});},
ini(n){return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);},
avc(n){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return['bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700','bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-rose-100 text-rose-700'][Math.abs(h)%5];},
ci(c){return{'Herbs':'🌱','Resin':'🌲','Oils':'🫒','Seeds':'🫘'}[c]||'📄';},
esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;},

// ========== CARDS ==========
renderBlogSection(){
const el=document.getElementById('blogGrid');if(!el||!this.posts.length)return;
el.innerHTML=this.posts.map(p=>{const c=this.cc(p.category),g=this.gr(p.color),lk=this.totalLikes(p),cm=this.allComments(p).length,vw=this.totalViews(p),li=this.isLiked(p);
return`<article class="group cursor-pointer bg-white rounded-2xl border border-emerald-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1" onclick="Blog.openModal('${p.slug}')">
<div class="relative h-48 bg-gradient-to-br ${g} flex items-center justify-center"><div class="text-center text-white/90 px-6"><span class="text-4xl mb-2 block">${this.ci(p.category)}</span><span class="text-xs font-medium uppercase tracking-wider opacity-75">${p.category}</span></div><div class="absolute top-3 left-3"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}">${p.category}</span></div><div class="absolute top-3 right-3"><span class="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-emerald-700">${p.readTime}</span></div></div>
<div class="p-5"><h3 class="font-bold text-emerald-900 text-base leading-snug mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">${p.title}</h3><p class="text-emerald-700/60 text-sm leading-relaxed mb-4 line-clamp-2">${p.excerpt}</p>
<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full ${this.avc(p.author.name)} flex items-center justify-center text-[10px] font-bold">${this.ini(p.author.name)}</div><div><p class="text-xs font-medium text-emerald-900">${p.author.name}</p><p class="text-[10px] text-emerald-600/50">${this.fmt(p.date)}</p></div></div>
<div class="flex items-center gap-3 text-emerald-600/50 text-xs"><span class="flex items-center gap-1">❤️${lk}</span><span class="flex items-center gap-1">💬${cm}</span><span class="flex items-center gap-1">👁️${vw}</span></div></div></div></article>`;}).join('');},

// ========== MODAL ==========
async openModal(slug){
this._activeSlug=slug;const p=this.getPost(slug);if(!p)return;
fetch('/api/blog/views',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,vid:this.vid()})}).catch(()=>{});
const c=this.cc(p.category),g=this.gr(p.color),lk=this.totalLikes(p),li=this.isLiked(p),vw=this.totalViews(p),cms=this.allComments(p);
const m=document.getElementById('blogModal'),ct=document.getElementById('blogModalContent');
ct.innerHTML=`<div class="max-w-3xl mx-auto">
<div class="relative h-48 sm:h-56 bg-gradient-to-br ${g} rounded-t-2xl flex items-center justify-center -mx-6 -mt-6 mb-6"><span class="text-6xl text-white/80">${this.ci(p.category)}</span><button onclick="Blog.closeModal()" class="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
<div class="flex flex-wrap items-center gap-3 mb-3"><span class="px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}">${p.category}</span><span class="text-xs text-emerald-600/50">${this.fmt(p.date)}</span><span class="text-xs text-emerald-600/50">${p.readTime}</span><span class="text-xs text-emerald-600/50">👁️ ${vw} views</span></div>
<h2 class="text-2xl sm:text-3xl font-bold text-emerald-900 mb-3 leading-tight">${p.title}</h2>
<div class="flex items-center justify-between mb-6 pb-6 border-b border-emerald-100"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full ${this.avc(p.author.name)} flex items-center justify-center text-sm font-bold">${this.ini(p.author.name)}</div><div><p class="text-sm font-semibold text-emerald-900">${p.author.name}</p><p class="text-xs text-emerald-600/50">${p.author.role}</p></div></div>
<button onclick="Blog.toggleLike('${p.slug}')" id="likeBtn_${p.slug}" class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${li?'bg-red-50 text-red-500 border border-red-200':'bg-emerald-50 text-emerald-600 border border-emerald-200'}"><svg class="w-4 h-4" fill="${li?'currentColor':'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span id="likeCount_${p.slug}">${lk}</span></button></div>
<div class="prose prose-emerald max-w-none mb-8 text-emerald-900/80 leading-relaxed text-sm [&>p]:mb-4 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-emerald-900 [&>h3]:mt-6 [&>h3]:mb-3">${p.content}</div>
<div class="flex flex-wrap gap-2 mb-8 pb-6 border-b border-emerald-100">${p.tags.map(t=>`<span class="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 border border-emerald-100">#${t}</span>`).join('')}</div>
<div><h3 class="text-lg font-bold text-emerald-900 mb-4">💬 Comments</h3>
<div id="authArea_${slug}" class="mb-4"></div>
<div id="cList_${slug}" class="space-y-1 mb-4 max-h-[500px] overflow-y-auto pr-1">${this._tree(cms)}</div>
<div id="cForm_${slug}"></div></div></div>`;
m.classList.remove('hidden');m.classList.add('flex');document.body.style.overflow='hidden';
this._ui(slug);},

_ui(slug){Auth.renderInlineForm('authArea_'+slug,()=>this._ui(slug));
const fa=document.getElementById('cForm_'+slug);if(!fa)return;
if(Auth.user)fa.innerHTML=`<div class="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100"><textarea id="cTxt_${slug}" rows="3" placeholder="Share your thoughts..." class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 resize-none mb-3"></textarea><div class="flex justify-between items-center"><p id="cMsg_${slug}" class="text-xs hidden"></p><button onclick="Blog.addComment('${slug}')" class="ml-auto px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Post Comment</button></div></div>`;
else fa.innerHTML='<p class="text-sm text-emerald-600/50 text-center py-3">Please log in to leave a comment.</p>';},

// ========== COMMENT TREE ==========
_tree(cms){if(!cms.length)return'<p class="text-sm text-emerald-600/50 text-center py-4">No comments yet. Be the first!</p>';return cms.map(c=>this._c(c,0)).join('');},

_c(c,d){
const ml=d>0?`margin-left:${Math.min(d,3)*20}px;`:'border-l-0';
const bd=d>0?'border-l-2 border-emerald-100 pl-3':'pt-4 border-t border-emerald-50';
const pend=c.status==='pending';const adm=Auth.user?.is_admin;
let badges='';
if(c.isStatic)badges+='<span class="text-[10px] text-emerald-400 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">sample</span>';
if(pend&&adm)badges+='<span class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">PENDING</span>';

let adminBtn='';
if(adm&&pend&&!c.isStatic)adminBtn=`<button onclick="Blog.moderate(${c.id},'approved')" class="text-[10px] text-green-600 hover:underline ml-1">Approve</button><button onclick="Blog.moderate(${c.id},'rejected')" class="text-[10px] text-red-500 hover:underline ml-1">Reject</button>`;

const lkClass=c.myReaction==='like'?'text-blue-500 font-medium':'text-emerald-500/40 hover:text-blue-500';
const dkClass=c.myReaction==='dislike'?'text-red-500 font-medium':'text-emerald-500/40 hover:text-red-500';
const replyChildren=(c.children||[]).map(r=>this._c(r,d+1)).join('');
const replyFormId='rpl_'+c.id;
const showReplyForm=!c.isStatic&&d<3?`<button onclick="Blog.toggleReplyForm(${c.id})" class="text-xs text-emerald-500/40 hover:text-emerald-600 ml-1">Reply</button>`:'';
const reactBtns=c.isStatic
?`<span class="flex items-center gap-0.5 text-emerald-500/40 text-xs">👍 ${c.likes||0}</span><span class="flex items-center gap-0.5 text-emerald-500/40 text-xs">👎 0</span>`
:`<button onclick="Blog.react(${c.id},'like')" class="flex items-center gap-0.5 ${lkClass} text-xs transition-colors">👍 <span id="lk_${c.id}">${c.likes||0}</span></button>
<button onclick="Blog.react(${c.id},'dislike')" class="flex items-center gap-0.5 ${dkClass} text-xs transition-colors">👎 <span id="dk_${c.id}">${c.dislikes||0}</span></button>`;

return`<div class="py-3 ${bd}" style="${ml}">
<div class="flex gap-2.5"><div class="w-7 h-7 rounded-full ${this.avc(c.author||'Anon')} flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">${this.ini(c.author||'Anonymous')}</div>
<div class="flex-1 min-w-0"><div class="flex items-center gap-1 mb-1 flex-wrap"><span class="text-sm font-semibold text-emerald-900">${this.esc(c.author||'Anonymous')}</span><span class="text-[10px] text-emerald-600/40">${this.fmt(c.date||c.created_at)}</span>${badges}</div>
<p class="text-sm text-emerald-900/70 leading-relaxed">${c.isStatic?c.text:this.esc(c.text)}</p>
<div class="flex items-center gap-2 mt-1.5 flex-wrap">
${reactBtns}
${showReplyForm}${adminBtn}
</div></div></div></div>
<div id="${replyFormId}" class="hidden pl-10 py-2">${Auth.user?`<div class="flex gap-2 mb-2"><textarea id="rplTxt_${c.id}" rows="2" placeholder="Write a reply..." class="flex-1 px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 resize-none"></textarea></div><div class="flex justify-end gap-2"><button onclick="Blog.toggleReplyForm(${c.id})" class="px-3 py-1.5 text-xs text-emerald-600/50 hover:text-emerald-600">Cancel</button><button onclick="Blog.addReply('${c.post_slug||this._activeSlug}',${c.id})" class="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700">Reply</button></div>`:'<p class="text-xs text-emerald-600/40">Log in to reply.</p>'}</div>
${replyChildren}`;},

// ========== ACTIONS ==========
async react(cid,type){
try{const r=await fetch('/api/blog/comment/reaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comment_id:cid,reaction_type:type,visitor_id:this.vid()})});
if(r.ok){const d=await r.json();const le=document.getElementById('lk_'+cid);const de=document.getElementById('dk_'+cid);
if(le){le.textContent=d.likes;le.parentElement.className=`flex items-center gap-0.5 ${d.myReaction==='like'?'text-blue-500 font-medium':'text-emerald-500/40 hover:text-blue-500'} text-xs transition-colors`;}
if(de){de.textContent=d.dislikes;de.parentElement.className=`flex items-center gap-0.5 ${d.myReaction==='dislike'?'text-red-500 font-medium':'text-emerald-500/40 hover:text-red-500'} text-xs transition-colors`;}
}}catch(e){}},

toggleReplyForm(cid){const el=document.getElementById('rpl_'+cid);if(el)el.classList.toggle('hidden');},

async addComment(slug){
if(!Auth.user)return;const ta=document.getElementById('cTxt_'+slug);const msg=document.getElementById('cMsg_'+slug);
const text=(ta?.value||'').trim();if(!text){if(msg){msg.textContent='Write something first';msg.className='text-xs text-red-500';}return;}
try{const r=await fetch('/api/blog/comment',{method:'POST',headers:{'Content-Type':'application/json',...Auth.authHeaders()},body:JSON.stringify({slug,text})});
const d=await r.json();if(r.ok){if(d.status==='pending'&&msg){msg.textContent='Your comment is awaiting review.';msg.className='text-xs text-amber-600';msg.classList.remove('hidden');}else if(msg){msg.classList.add('hidden');}ta.value='';
await this._refreshComments(slug);}else{if(msg){msg.textContent=d.error||'Failed';msg.className='text-xs text-red-500';msg.classList.remove('hidden');}}
}catch(e){if(msg){msg.textContent='Network error';msg.className='text-xs text-red-500';msg.classList.remove('hidden');}}},

async addReply(slug,parentId){
if(!Auth.user)return;const ta=document.getElementById('rplTxt_'+parentId);if(!ta)return;const text=ta.value.trim();if(!text)return;
try{const r=await fetch('/api/blog/comment',{method:'POST',headers:{'Content-Type':'application/json',...Auth.authHeaders()},body:JSON.stringify({slug,text,parent_id:parentId})});
if(r.ok){ta.value='';this.toggleReplyForm(parentId);await this._refreshComments(slug);
const msg=document.getElementById('cMsg_'+slug);if(msg){msg.textContent='Reply submitted for review.';msg.className='text-xs text-amber-600';msg.classList.remove('hidden');}}
}catch(e){}},

async moderate(cid,action){
try{await fetch('/api/blog/comment/approve',{method:'POST',headers:{'Content-Type':'application/json',...Auth.authHeaders()},body:JSON.stringify({comment_id:cid,action})});
await this._refreshComments(this._activeSlug);}catch(e){}},

async _refreshComments(slug){
try{const r=await fetch('/api/blog/comment?slug='+slug+'&vid='+this.vid(),{headers:Auth.authHeaders()});if(r.ok){const d=await r.json();this.apiComments[slug]=d.comments;
const post=this.getPost(slug);const el=document.getElementById('cList_'+slug);
if(el)el.innerHTML=this._tree(this.allComments(post));
this.renderBlogSection();}}catch(e){}},

async toggleLike(slug){
const vid=this.vid();try{await fetch('/api/blog/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,vid})});
const r=await fetch('/api/blog/like?slug='+slug+'&vid='+vid);const d=await r.json();if(r.ok)this.apiLikes[slug]=d;
const p=this.getPost(slug);const li=!!this.apiLikes[slug]?.liked;const tl=this.totalLikes(p);
const btn=document.getElementById('likeBtn_'+slug);const cnt=document.getElementById('likeCount_'+slug);
if(btn&&cnt){btn.className=`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${li?'bg-red-50 text-red-500 border border-red-200':'bg-emerald-50 text-emerald-600 border border-emerald-200'}`;btn.querySelector('svg').setAttribute('fill',li?'currentColor':'none');cnt.textContent=tl;}
this.renderBlogSection();}catch(e){}},

closeModal(){const m=document.getElementById('blogModal');m.classList.add('hidden');m.classList.remove('flex');document.body.style.overflow='';}
};