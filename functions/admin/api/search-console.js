import { accessTokenForScope } from './ga4.js';
const HOST='pro-baseball-watch-guide.com';
const SC_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const response=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const dateOffset=n=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const isOwn=s=>{if(s==='sc-domain:'+HOST)return true;try{const u=new URL(s);return u.protocol==='https:'&&u.hostname===HOST;}catch{return false;}};
async function query(token,site,params){
 const r=await fetch('https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)+'/searchAnalytics/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(params)});
 const body=await r.json().catch(()=>({}));if(!r.ok)throw Error('Search Console API '+r.status+'：'+String(body.error?.message||'Google側の権限を確認してください。'));
 return body.rows||[];
}
export async function onRequestGet({env,request}){
 const site=String(env.GSC_SITE_URL||'').trim();
 if(!site)return response({configured:false,message:'GSC_SITE_URL をCloudflareに設定してください。'},503);
 if(!isOwn(site))return response({configured:false,message:'野球サイトのSearch Consoleプロパティだけを指定してください。'},503);
 const days=Number(new URL(request.url).searchParams.get('days')||30);
 if(![7,30,90].includes(days))return response({message:'指定期間が不正です。'},400);
 try{
  const token=await accessTokenForScope(env,SC_SCOPE);
  const base={startDate:dateOffset(-(days+2)),endDate:dateOffset(-3),type:'web',dataState:'final'};
  const [totals,trend,pages]=await Promise.all([
   query(token,site,{...base,rowLimit:1}),
   query(token,site,{...base,dimensions:['date'],rowLimit:days}),
   query(token,site,{...base,dimensions:['page'],rowLimit:15})
  ]);
  const total=totals[0];
  return response({configured:true,days,startDate:base.startDate,endDate:base.endDate,
   summary:total?{clicks:Number(total.clicks||0),impressions:Number(total.impressions||0),ctr:Number(total.ctr||0),position:Number(total.position||0)}:null,
   trend:trend.map(r=>({date:r.keys?.[0]||'',clicks:Number(r.clicks||0),impressions:Number(r.impressions||0)})).sort((a,b)=>a.date.localeCompare(b.date)),
   pages:pages.map(r=>({url:r.keys?.[0]||'',clicks:Number(r.clicks||0),impressions:Number(r.impressions||0),ctr:Number(r.ctr||0)}))
  });
 }catch(e){return response({configured:true,message:e.message||'検索データを取得できませんでした。'},502);}
}
