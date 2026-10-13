const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const uploadUrl='https://api.cloudinary.com/v1_1/dhzckqyuu/image/upload',receipt='https://res.cloudinary.com/dhzckqyuu/image/upload/fixture.png';
async function runtime(platform,fetchImpl,run){
 const originalFetch=global.fetch,originalForm=global.FormData,forms=[];
 class NativeForm{constructor(){this.parts=[];forms.push(this);}append(...args){this.parts.push(args);}}
 if(platform!=='web')global.FormData=NativeForm;
 global.fetch=fetchImpl;
 const file=path.resolve(__dirname,'../utils/cloudinary.ts'),mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));const original=mod.require.bind(mod);
 mod.require=specifier=>specifier==='react-native'?{Platform:{OS:platform}}:original(specifier);
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
 try{await run(mod.exports.uploadImageToCloudinary,forms);}finally{global.fetch=originalFetch;global.FormData=originalForm;}
}
let count=0;async function check(name,run){await run();count++;console.log('PASS '+name);}
const ok=()=>new Response(JSON.stringify({secure_url:receipt}),{headers:{'Content-Type':'application/json'}});
(async()=>{
 await check('The actual web helper posts image bytes as multipart with an automatic boundary',()=>runtime('web',async(url,options)=>{if(url==='blob:fixture')return new Response(new Blob(['fictional image'],{type:'image/png'}));assert.equal(url,uploadUrl);assert.equal(options.headers['Content-Type'],undefined);const file=options.body.get('file');assert.equal(file.type,'image/png');assert.equal(await file.text(),'fictional image');assert.equal(options.body.get('upload_preset'),'kraftkonect_unsigned');assert.equal(options.body.get('folder'),'providers');return ok();},async upload=>assert.equal(await upload('blob:fixture'),receipt)));
 await check('Native URI/name/MIME stays native and no manually broken boundary is supplied',()=>runtime('android',async(url,options)=>{assert.equal(url,uploadUrl);assert.equal(options.headers['Content-Type'],undefined);assert.deepEqual(options.body.parts[0],['file',{uri:'file:///portrait.jpg',name:'portrait.jpg',type:'image/jpeg'}]);return ok();},async upload=>assert.equal(await upload('file:///portrait.jpg'),receipt)));
 await check('Unknown, empty and unreadable web data never reaches the upload endpoint',async()=>{for(const response of [()=>new Response('text'),()=>new Response(new Blob([],{type:'image/png'})),()=>new Response('',{status:404})]){let posts=0;await runtime('web',async(url)=>{if(url===uploadUrl)posts++;return response();},async upload=>{await assert.rejects(upload('blob:fixture'));assert.equal(posts,0);});}});
 await check('Already changed identity does not read or post a photo',()=>runtime('web',async()=>{throw new Error('Unexpected HTTP');},async upload=>assert.rejects(upload('blob:fixture',()=>false))));
 await check('An account switch during local image decoding stops before upload',async()=>{let current=true,posts=0;await runtime('web',async(url)=>{if(url===uploadUrl)posts++;current=false;return new Response(new Blob(['image'],{type:'image/png'}));},async upload=>{await assert.rejects(upload('blob:fixture',()=>current));assert.equal(posts,0);});});
 await check('A delayed upload receipt cannot bind to a new identity',async()=>{let current=true;await runtime('android',async()=>{current=false;return ok();},async upload=>assert.rejects(upload('file:///portrait.png',()=>current)));});
 await check('HTTP failure cannot return a success URL',()=>runtime('android',async()=>new Response('{}',{status:503}),async upload=>assert.rejects(upload('file:///portrait.png'))));
 await check('Missing, insecure or foreign receipt URLs are rejected',async()=>{for(const secure_url of [undefined,'http://res.cloudinary.com/dhzckqyuu/a.png','https://example.test/photo.png','https://res.cloudinary.com/other/a.png'])await runtime('android',async()=>new Response(JSON.stringify({secure_url})),async upload=>assert.rejects(upload('file:///portrait.png')));});
 console.log(count+' public photo checks passed. No files were uploaded.');
})().catch(error=>{console.error(error);process.exitCode=1;});
