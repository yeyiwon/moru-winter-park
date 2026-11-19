import {sql} from 'drizzle-orm';
import {sqliteTable,text,real,integer,index,primaryKey,check} from 'drizzle-orm/sqlite-core';
export const visitors=sqliteTable('visitors',{
 id:text('id').primaryKey(),region:text('region').notNull().default('outdoors'),room:text('room').notNull(),name:text('name').notNull(),color:text('color').notNull(),colorTop:text('color_top'),fluff:real('fluff').notNull().default(100),roundness:real('roundness').notNull().default(50),accessory:text('accessory').notNull(),x:real('x').notNull(),z:real('z').notNull(),yaw:real('yaw').notNull(),y:real('y').notNull().default(.95),mode:text('mode').notNull().default(''),seen:integer('seen').notNull(),poseAt:integer('pose_at').notNull().default(0),speed:real('speed').notNull().default(0),gesture:text('gesture').notNull(),gestureAt:integer('gesture_at').notNull(),chat:text('chat').notNull().default(''),chatAt:integer('chat_at').notNull().default(0),inviteId:text('invite_id'),admittedAt:integer('admitted_at').notNull().default(0),kickedAt:integer('kicked_at').notNull().default(0),authType:text('auth_type').notNull().default('legacy')
},t=>[index('visitors_room_seen').on(t.room,t.seen)]);
export const treeDecorations=sqliteTable('tree_decorations',{
 id:text('id').primaryKey(),room:text('room').notNull(),author:text('author').notNull(),kind:text('kind').notNull(),color:text('color').notNull(),angle:real('angle').notNull(),height:real('height').notNull(),originX:real('origin_x'),originY:real('origin_y'),originZ:real('origin_z'),createdAt:integer('created_at').notNull()
},t=>[index('tree_decorations_room').on(t.room)]);
export const spaceOwner=sqliteTable('space_owner',{id:text('id').primaryKey(),userId:text('user_id').notNull()});
export const inviteRooms=sqliteTable('invite_rooms',{id:text('id').primaryKey(),salt:text('salt').notNull(),passwordHash:text('password_hash').notNull(),createdAt:integer('created_at').notNull()});
export const inviteAttempts=sqliteTable('invite_attempts',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),resetAt:integer('reset_at').notNull()});
export const worldInvites=sqliteTable('world_invites',{id:text('id').primaryKey(),tokenHash:text('token_hash').notNull().unique(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),revokedAt:integer('revoked_at')});
export const wishes=sqliteTable('wishes',{
 id:text('id').primaryKey(),room:text('room').notNull(),author:text('author').notNull(),authorName:text('author_name').notNull(),message:text('message').notNull(),visibility:text('visibility').notNull().default('public'),createdAt:integer('created_at').notNull()
},t=>[index('wishes_room').on(t.room)]);
export const wishReactions=sqliteTable('wish_reactions',{wishId:text('wish_id').notNull(),author:text('author').notNull()},t=>[index('wish_reactions_wish').on(t.wishId)]);
export const reports=sqliteTable('reports',{id:text('id').primaryKey(),room:text('room').notNull(),reporter:text('reporter').notNull(),targetType:text('target_type').notNull(),targetId:text('target_id').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull(),resolved:integer('resolved').notNull().default(0)},t=>[index('reports_room').on(t.room)]);
export const visitorBlocks=sqliteTable('visitor_blocks',{id:text('id').primaryKey(),createdAt:integer('created_at').notNull()});
export const quizOverrides=sqliteTable('quiz_overrides',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});
export const worldEvents=sqliteTable('world_events',{id:text('id').primaryKey(),title:text('title').notNull(),startsAt:integer('starts_at').notNull(),endsAt:integer('ends_at').notNull(),kind:text('kind').notNull(),enabled:integer('enabled').notNull().default(1)});

export const rideSeats=sqliteTable('ride_seats',{room:text('room').notNull(),kind:text('kind').notNull(),cabin:integer('cabin').notNull(),seat:integer('seat').notNull(),visitor:text('visitor').notNull().unique(),startedAt:integer('started_at').notNull(),expiresAt:integer('expires_at').notNull()},t=>[
 primaryKey({columns:[t.room,t.kind,t.cabin,t.seat]}),
 check('ride_seats_kind_seat',sql`(${t.kind} = 'dining' AND ${t.seat} IN (0,1,2)) OR (${t.kind} = 'gondola' AND ${t.seat} IN (0,1,2,3,4,5)) OR (${t.kind} NOT IN ('dining','gondola') AND ${t.seat} IN (0,1))`)
]);

export const worldSettings=sqliteTable('world_settings',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});
export const operationalErrors=sqliteTable('operational_errors',{id:text('id').primaryKey(),route:text('route').notNull(),code:text('code').notNull(),createdAt:integer('created_at').notNull(),revision:text('revision').notNull().default('legacy')},t=>[index('operational_errors_created').on(t.createdAt)]);

export const decorationBackups=sqliteTable('decoration_backups',{id:text('id').primaryKey(),room:text('room').notNull(),actor:text('actor').notNull(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull()});

export const quizCandidates=sqliteTable('quiz_candidates',{id:text('id').primaryKey(),payload:text('payload').notNull(),status:text('status').notNull(),createdAt:integer('created_at').notNull()});
export const quizGenerationRuns=sqliteTable('quiz_generation_runs',{day:text('day').primaryKey(),status:text('status').notNull(),createdAt:integer('created_at').notNull(),count:integer('count').notNull().default(0),usage:text('usage')});

export const ownerLoginCodes=sqliteTable('owner_login_codes',{codeHash:text('code_hash').primaryKey(),stateHash:text('state_hash').notNull(),expiresAt:integer('expires_at').notNull()});
export const ownerSessions=sqliteTable('owner_sessions',{sessionId:text('session_id').primaryKey(),expiresAt:integer('expires_at').notNull()});
export const moderationAudit=sqliteTable('moderation_audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),target:text('target').notNull(),createdAt:integer('created_at').notNull()},t=>[index('moderation_audit_created').on(t.createdAt)]);

// A private knowledge journal belongs to the existing anonymous visitor session.
// Snapshot revisions preserve the explanation the visitor actually answered.
export const quizJournal=sqliteTable('quiz_journal',{
 visitor:text('visitor').notNull(),recordId:text('record_id').notNull(),questionId:text('question_id').notNull(),revision:text('revision').notNull(),snapshot:text('snapshot').notNull(),choice:integer('choice').notNull(),correct:integer('correct').notNull(),everCorrect:integer('ever_correct').notNull(),saved:integer('saved').notNull().default(0),firstAt:integer('first_at').notNull(),updatedAt:integer('updated_at').notNull(),lastAttempt:text('last_attempt').notNull()
},t=>[primaryKey({columns:[t.visitor,t.recordId]}),index('quiz_journal_visitor_updated').on(t.visitor,t.updatedAt)]);
