/**
 * FRAME private TMDB gateway.
 * Deploy to Cloudflare Workers. Configure secret TMDB_API_KEY (TMDB v3 key).
 * Never put your TMDB key in this file or wrangler.toml.
 */
const ALLOWED_ORIGIN='https://mrjonathansingh.github.io';
const paths=[/^search\/tv$/, /^tv\/\d+$/, /^tv\/\d+\/season\/\d+$/];
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const headers={'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='GET')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
  if(origin&&origin!==ALLOWED_ORIGIN)return new Response(JSON.stringify({error:'Origin not allowed'}),{status:403,headers});
  if(!env.TMDB_API_KEY)return new Response(JSON.stringify({error:'TMDB_API_KEY secret missing'}),{status:503,headers});
  const url=new URL(request.url),path=url.pathname.replace(/^\/+/,'');
  if(!paths.some(p=>p.test(path)))return new Response(JSON.stringify({error:'Unsupported TMDB endpoint'}),{status:404,headers});
  const target=new URL('https://api.themoviedb.org/3/'+path);
  for(const key of ['query','language','include_adult']){const value=url.searchParams.get(key);if(value)target.searchParams.set(key,value.slice(0,180))}
  target.searchParams.set('api_key',env.TMDB_API_KEY);
  target.searchParams.set('language','en-US');
  try{
   const response=await fetch(target.toString(),{headers:{'Accept':'application/json'},cf:{cacheTtl:1800,cacheEverything:true}});
   return new Response(await response.text(),{status:response.status,headers:{...headers,'Cache-Control':'public, max-age=300'}});
  }catch{return new Response(JSON.stringify({error:'TMDB unavailable'}),{status:502,headers})}
 }
};
