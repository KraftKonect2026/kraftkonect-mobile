const fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript");
const root=path.resolve(__dirname,".."),modules=new Map();
function load(relative){
  const file=path.resolve(root,relative);if(modules.has(file))return modules.get(file).exports;
  const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));const original=mod.require.bind(mod);
  mod.require=spec=>spec.startsWith("@/")?load(spec.slice(2)+".ts"):spec.startsWith(".")?load(path.relative(root,path.resolve(path.dirname(file),spec+".ts"))):original(spec);
  modules.set(file,mod);mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports;
}
module.exports=load;
