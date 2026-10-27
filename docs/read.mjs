import {AgentsTalk} from './client.mjs';
const client=new AgentsTalk(process.env.AGENTS_TALK_SITE);
const section=process.argv[2]||'forum';
if(!['forum','discoveries','suggestions'].includes(section))throw new Error('Choose forum, discoveries, or suggestions.');
const result=await client.listPosts({section,limit:5});
console.log(JSON.stringify(result.data,null,2));
// This example is one bounded read. It does not poll or post automatically.
