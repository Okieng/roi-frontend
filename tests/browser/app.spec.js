import { test, expect } from '@playwright/test';
const user = { id:1, name:'Akun Satu', email:'satu@example.com' };
const record = { id:42, ad_spend:'200000.00',other_costs:'500000.00',total_revenue:'1000000.00',total_cost:'700000.00',profit:'300001.00',roi_percentage:'42.8573',created_at:'2026-10-01T02:00:00Z' };
async function setup(page, options = {}) {
 const calls = [];
 await page.route('**/api/**', async route => {
  const request = route.request(); const path = new URL(request.url()).pathname;
  calls.push({path,method:request.method(),body:request.postDataJSON(),auth:request.headers().authorization});
  if(request.method() === 'OPTIONS') return route.fulfill({ status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'} });
  let status = 200, body;
  if(path.includes('/auth/')) { status = options.loginStatus || 200; body = status === 200 ? {user:options.user || user,token:'test-token'} : {message:'Invalid credentials.'}; }
  else if(path.endsWith('/user')) { status = options.sessionStatus || 200; body = {data:user}; }
  else if(request.method() === 'POST') { status = options.saveStatus || 201; body = status === 201 ? {data:record} : {message:'Invalid inputs',errors:{ad_spend:['Total biaya tidak valid.']}}; }
  else { const current = Number(new URL(request.url()).searchParams.get('page')); body = {data: options.empty ? [] : [record], meta:{current_page:current,last_page:2,total:16}}; }
  await route.fulfill({status,json:body,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'Retry-After','Retry-After':'2'}});
 });
 return calls;
}
async function signIn(page) {
 await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Kata sandi',{exact:true}).fill('password123'); await page.getByRole('button',{name:'Masuk',exact:true}).click(); await expect(page).toHaveURL(/calculator$/);
}
test('login, live calculation, authoritative save, pagination and local logout', async ({page}) => {
 const calls = await setup(page); await signIn(page);
 await expect(page.locator('.roi-value')).toHaveText('42,86%');
 await page.getByRole('button',{name:'Simpan Perhitungan'}).click();
 await expect(page.getByRole('status')).toContainText('berhasil disimpan');
 await expect(page.locator('.metric').filter({hasText:'Laba / Rugi'})).toContainText('300.001');
 const saved = calls.find(c=>c.path.endsWith('/calculations') && c.method === 'POST');
 expect(saved.body).toEqual({ad_spend:'200000.00',other_costs:'500000.00',total_revenue:'1000000.00'}); expect(saved.auth).toBe('Bearer test-token');
 expect(calls.find(c=>c.path.endsWith('/auth/login')).auth).toBeUndefined();
 await page.getByRole('link',{name:'Riwayat',exact:true}).click(); await expect(page.getByText('Halaman 1',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Berikutnya'}).click(); await expect(page.getByText('Halaman 2',{exact:false})).toBeVisible();
 await page.reload(); await expect(page.getByRole('heading',{name:'Perhitungan Anda'})).toBeVisible(); expect(calls.some(c=>c.path.endsWith('/user'))).toBeTruthy();
 await page.getByRole('button',{name:'Keluar'}).click(); await expect(page).toHaveURL(/login$/); expect(await page.evaluate(()=>sessionStorage.getItem('roi-token'))).toBeNull();
 await page.goto('/history'); await expect(page).toHaveURL(/login$/); expect(calls.some(c=>c.path.includes('logout'))).toBeFalsy();
});
test('register creates session directly',async({page})=>{
 const calls=await setup(page); await page.goto('/register'); await page.getByLabel('Nama lengkap').fill(user.name); await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Kata sandi',{exact:true}).fill('password123'); await page.getByLabel('Konfirmasi kata sandi').fill('password123'); await page.getByRole('button',{name:'Buat akun',exact:true}).click(); await expect(page).toHaveURL(/calculator$/); expect(calls.find(c=>c.path.endsWith('/auth/register')).body.password_confirmation).toBe('password123');
});
test('editing, zero, invalid and large values preserve precision',async({page})=>{
 await setup(page); await signIn(page);
 const ad=page.getByLabel('Biaya Iklan',{exact:true}); const other=page.getByLabel('Biaya Lain',{exact:true}); const revenue=page.getByLabel('Total Pendapatan',{exact:true});
 await ad.fill('0'); await other.fill('0'); await expect(page.locator('.roi-value')).toHaveText('—'); await expect(page.getByRole('button',{name:'Simpan Perhitungan'})).toBeDisabled();
 await ad.fill('9999999999999999,98'); await other.fill('0,01'); await revenue.fill('9999999999999999,98'); await revenue.blur(); await expect(revenue).toHaveValue('9.999.999.999.999.999,98'); await expect(page.locator('.metric').filter({hasText:'Laba / Rugi'})).toContainText('-0,01');
 await ad.fill('-200'); await expect(page.getByRole('button',{name:'Simpan Perhitungan'})).toBeDisabled(); await expect(ad).toHaveValue('-200');
 await ad.fill('200000'); await other.fill('0'); await revenue.fill('0'); await expect(page.locator('.roi-value')).toHaveText('-100,00%'); await expect(page.locator('.metric').filter({hasText:'Margin Laba'})).toContainText('—');
 await ad.fill('123456'); await ad.press('Home'); await ad.press('ArrowRight'); await ad.press('Delete'); await ad.blur(); await expect(ad).toHaveValue('13.456');
});
test('session network error retains token and retry recovers',async({page})=>{
 const options={sessionStatus:503}; await setup(page,options); await page.goto('/login'); await page.evaluate(()=>sessionStorage.setItem('roi-token','test-token')); await page.goto('/history'); await expect(page.getByRole('heading',{name:'Sesi belum dapat diverifikasi'})).toBeVisible(); expect(await page.evaluate(()=>sessionStorage.getItem('roi-token'))).toBe('test-token'); options.sessionStatus=200; await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); await expect(page).toHaveURL(/calculator$/);
});
test('invalid credentials and failed save show errors without clearing inputs',async({page})=>{
 const options={loginStatus:401,saveStatus:422}; await setup(page,options); await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Kata sandi',{exact:true}).fill('wrongpass'); await page.getByRole('button',{name:'Masuk',exact:true}).click(); await expect(page.getByRole('alert')).toContainText('Email atau kata sandi salah'); options.loginStatus=200; await page.getByRole('button',{name:'Masuk',exact:true}).click(); await expect(page).toHaveURL(/calculator$/); await page.getByRole('button',{name:'Simpan Perhitungan'}).click(); await expect(page.getByLabel('Biaya Iklan',{exact:true})).toHaveValue('200.000'); await expect(page.getByText('Total biaya tidak valid.').first()).toBeVisible();
});
test('empty history and responsive layouts',async({page})=>{
 await setup(page,{empty:true}); await signIn(page);
 for(const width of [320,375,414,768,1440]) { await page.setViewportSize({width,height:1000}); await expect(page.getByRole('button',{name:'Simpan Perhitungan'})).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy(); }
 await page.screenshot({path:'test-results/calculator-desktop.png',fullPage:true});
 await page.setViewportSize({width:375,height:900}); await page.screenshot({path:'test-results/calculator-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Riwayat',exact:true}).click(); await expect(page.getByRole('heading',{name:'Riwayat Anda dimulai di sini'})).toBeVisible();
});

test('private 401 clears session and 429 respects Retry-After',async({page})=>{
 const options={}; await setup(page,options); await signIn(page); options.sessionStatus=401; await page.reload(); await expect(page).toHaveURL(/login$/); expect(await page.evaluate(()=>sessionStorage.getItem('roi-token'))).toBeNull();
 options.loginStatus=429; await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Kata sandi',{exact:true}).fill('password123'); await page.getByRole('button',{name:'Masuk',exact:true}).click(); await expect(page.getByRole('button',{name:/Coba lagi dalam/})).toBeDisabled(); await expect(page.getByRole('button',{name:'Masuk',exact:true})).toBeEnabled({timeout:5000});
});
test('switching accounts does not keep prior history',async({page})=>{
 const options={}; await setup(page,options); await signIn(page); await page.getByRole('link',{name:'Riwayat',exact:true}).click(); await expect(page.getByText('16 perhitungan',{exact:false})).toBeVisible(); await page.getByRole('button',{name:'Keluar'}).click(); options.empty=true; options.user={id:2,name:'Akun Dua',email:'dua@example.com'}; await signIn(page); await expect(page.locator('.user-name')).toHaveText('Akun Dua'); await page.getByRole('link',{name:'Riwayat',exact:true}).click(); await expect(page.getByRole('heading',{name:'Riwayat Anda dimulai di sini'})).toBeVisible(); await expect(page.getByText('300.001',{exact:false})).toHaveCount(0);
});
