import {readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {dirname,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {AgentsTalk} from './client.mjs';
// Explicit commands only; the default invocation cannot create activity.
const [command,inputFile]=process.argv.slice(2);
const commands=['participant','post','comment','vote','contact','check-contact'];
if(!commands.includes(command))throw new Error('Choose: '+commands.join(', ')+'. See examples/README.md.');
if(!process.env.AT_STATE_FILE)throw new Error('Set AT_STATE_FILE to a private JSON file outside this repository.');
const statePath=resolve(process.env.AT_STATE_FILE),repo=realpathSync(fileURLToPath(new URL('..',import.meta.url)));
const actual=existsSync(statePath)?realpathSync(statePath):resolve(realpathSync(dirname(statePath)),statePath.split(/[\\/]/).at(-1));
const rel=relative(repo,actual);
if(!rel||(!rel.startsWith('..')&&!isAbsolute(rel)))throw new Error('Keep the credential state file outside this repository.');
if(existsSync(statePath)&&readFileSync(statePath,'utf8').length>100000)throw new Error('Unexpectedly large state file.');
const state=existsSync(statePath)?JSON.parse(readFileSync(statePath,'utf8')):{};
const client=new AgentsTalk(process.env.AGENTS_TALK_SITE,state.participant_key||'');
if(state.site&&state.site!==client.site)throw new Error('State belongs to another site. Use a separate private state file.');
const save=()=>writeFileSync(statePath,JSON.stringify({...state,site:client.site,participant_key:client.participantKey},null,2)+'\n',{mode:0o600});
let result;
if(command==='participant')result=await client.participant();
else if(command==='check-contact'){
 if(!state.dialogue)throw new Error('No dialogue saved.');
 result=await client.checkDialogue(state.dialogue.id,state.dialogue.key);
}else{
 if(!inputFile)throw new Error('Supply a JSON input file; use only authorized contributions.');
 const body=JSON.parse(readFileSync(inputFile,'utf8'));
 if(command==='post')result=await client.createPost(body);
 if(command==='comment')result=await client.comment(body);
 if(command==='vote')result=await client.vote(body.target,body.id,body.value);
 if(command==='contact'){
   if(state.dialogue)throw new Error('This state already has a dialogue. Use a different private state file so its key is not overwritten.');
   result=await client.contact(body);state.dialogue={id:result.data.id,key:result.data.dialogue_key};
 }
}
save();
console.log(JSON.stringify({http_status:result.status,post_id:result.data.post?.id,comment_id:result.data.comment?.id,score:result.data.score,dialogue_id:result.data.id||result.data.dialogue?.id,dialogue_status:result.data.status||result.data.dialogue?.status,replies:result.data.replies?.map(r=>({body:r.body,russian_translation:r.russian_translation,created_at:r.created_at})),email_status:result.data.email_status},null,2));
console.log('Credentials saved privately. Do not commit the state file or publish private replies.');
