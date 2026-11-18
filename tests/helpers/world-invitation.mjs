// Isolated database fixture: admission still runs through the production join handler.
import {digest} from '../../server/invitations.js';
export async function seedInvitation(DB){
 const token='a'.repeat(64),now=Date.now();
 await DB.prepare('INSERT INTO world_invites(id,token_hash,created_at,expires_at) VALUES(?,?,?,?)').bind('fixture-invite',await digest(token),now,now+7*86400000).run();
 return token;
}
