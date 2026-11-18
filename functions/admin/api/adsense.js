const DOMAIN='pro-baseball-watch-guide.com';
const reply=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
function dt(n){const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+n);return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};}
async function token(env){
 const query=new URLSearchParams({client_id:env.ADSENSE_OAUTH_CLIENT_ID,client_secret:env.ADSENSE_OAUTH_CLIENT_SECRET,refresh_token:env.ADSENSE_REFRESH_TOKEN,grant_type:'refresh_token'});
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:query});
 const body=await r.json().catch(()=>({}));
 if(!r.ok||!body.access_token)throw Error('OAuth認証 '+r.status+'：'+String(body.error_description||body.error||'トークンを確認してください。'));
 return body.access_token;
}
export async function onRequestGet({env,request}){
 let account=String(env.ADSENSE_ACCOUNT_ID||'').trim();
 if(/^pub-\d+$/.test(account))account='accounts/'+account;
 if(!/^accounts\/pub-\d+$/.test(account)||!env.ADSENSE_OAUTH_CLIENT_ID||!env.ADSENSE_OAUTH_CLIENT_SECRET||!env.ADSENSE_REFRESH_TOKEN)
   return reply({configured:false,message:'AdSense OAuthが未設定です。CloudflareにADSENSE_ACCOUNT_ID・ADSENSE_OAUTH_CLIENT_ID・ADSENSE_OAUTH_CLIENT_SECRET・ADSENSE_REFRESH_TOKENを設定してください。'},503);
 const days=Number(new URL(request.url).searchParams.get('days')||30);
 if(![7,30,90].includes(days))return reply({message:'指定期間が不正です。'},400);
 try{
  const auth=await token(env),start=dt(-(days-1)),end=dt(0),params=new URLSearchParams();
  params.set('dateRange','CUSTOM');
  for(const name of ['year','month','day']){params.set('startDate.'+name,String(start[name]));params.set('endDate.'+name,String(end[name]));}
  params.append('dimensions','DATE');
  for(const m of ['ESTIMATED_EARNINGS','PAGE_VIEWS','PAGE_VIEWS_RPM'])params.append('metrics',m);
  params.append('filters','OWNED_SITE_DOMAIN_NAME=='+DOMAIN);
  params.set('reportingTimeZone','ACCOUNT_TIME_ZONE');
  const r=await fetch('https://adsense.googleapis.com/v2/'+account+'/reports:generate?'+params,{headers:{Authorization:'Bearer '+auth,Accept:'application/json'}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error('AdSense API '+r.status+'：'+String(data.error?.message||'権限またはサイトの状態を確認してください。'));
  const headers=data.headers||[],names=headers.map(h=>h.name);
  const idx=key=>names.indexOf(key);
  if(['DATE','ESTIMATED_EARNINGS','PAGE_VIEWS','PAGE_VIEWS_RPM'].some(k=>idx(k)<0))throw Error('必要なAdSense指標を取得できません。');
  const currency=headers[idx('ESTIMATED_EARNINGS')]?.currency;
  if(!currency)throw Error('AdSenseの通貨情報を取得できません。');
  const trend=(data.rows||[]).map(row=>{
   const get=key=>String(row.cells?.[idx(key)]?.value??'');
   return {date:get('DATE'),earnings:Number(get('ESTIMATED_EARNINGS')),views:Number(get('PAGE_VIEWS')),rpm:Number(get('PAGE_VIEWS_RPM'))};
  });
  if(trend.some(x=>!Number.isFinite(x.earnings)||!Number.isFinite(x.views)||!Number.isFinite(x.rpm)))throw Error('AdSenseの指標形式が不正です。');
  const totals=trend.reduce((a,r)=>({earnings:a.earnings+r.earnings,views:a.views+r.views}),{earnings:0,views:0});
  return reply({configured:true,domain:DOMAIN,currency,days,summary:{earnings:totals.earnings,views:totals.views,rpm:totals.views?1000*totals.earnings/totals.views:null},trend:trend.sort((a,b)=>a.date.localeCompare(b.date))});
 }catch(e){return reply({configured:true,message:e.message||'AdSenseを取得できませんでした。'},502);}
}
