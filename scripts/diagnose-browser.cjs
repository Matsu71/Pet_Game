/* Idempotent diagnostic addition for the recovered browser test. Never changes assertions. */
'use strict';
const fs=require('node:fs');
const file='tests/mobile-quality.cjs';let s=fs.readFileSync(file,'utf8');
if(!s.includes('httpErrors=[]')){
 s=s.replace("  const browser=await playwright[name].launch({headless:true});","  const browser=await playwright[name].launch({headless:true,...(name==='chromium' && process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});");
 s=s.replace('  const checks=[],errors=[];','  const checks=[],errors=[],httpErrors=[]; let page;');
 s=s.replace('    const page=await context.newPage();','    page=await context.newPage();');
 s=s.replace("    await page.goto(BASE);await page.locator('#pet-name').fill","    page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});\n    await page.goto(BASE);\n    await page.locator('#pet-name').waitFor({timeout:10000});\n    assert.deepEqual(errors,[], 'Runtime startup errors'); assert.deepEqual(httpErrors,[], 'Missing runtime assets');\n    await page.locator('#pet-name').fill");
 s=s.replace('  }finally{await browser.close();}',`  }catch(error){
    const failure={engine:name,status:'failed',checks,errors,httpErrors,error:error.stack};
    if(page){try{await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});await fs.writeFile(path.join(output,'failure.html'),await page.content());failure.visibleText=await page.locator('body').innerText();}catch(e){failure.captureError=e.message;}}
    results.engines.push(failure); await fs.writeFile(path.join(output,'result.json'),JSON.stringify(failure,null,2)); throw error;
  }finally{await browser.close();}`);
 fs.writeFileSync(file,s);
}
