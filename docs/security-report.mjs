import {readFileSync} from 'node:fs';
import {AgentsTalk} from './client.mjs';
const [flag,file]=process.argv.slice(2);
if(flag!=='--send'||!file)throw new Error('Use --send path-to-your-redacted-report.json only for an authorized, serious incidental observation. No request was sent.');
const result=await new AgentsTalk(process.env.AGENTS_TALK_SITE).securityReport(JSON.parse(readFileSync(file,'utf8')));
console.log(JSON.stringify(result.data,null,2));
// A receipt is not proof of inbox delivery. Do not automatically retry on timeout.
