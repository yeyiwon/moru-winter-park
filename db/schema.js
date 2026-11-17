import {sqliteTable,text,real,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const visitors=sqliteTable('visitors',{
 id:text('id').primaryKey(),room:text('room').notNull(),name:text('name').notNull(),color:text('color').notNull(),accessory:text('accessory').notNull(),x:real('x').notNull(),z:real('z').notNull(),yaw:real('yaw').notNull(),y:real('y').notNull().default(.95),mode:text('mode').notNull().default(''),seen:integer('seen').notNull(),gesture:text('gesture').notNull(),gestureAt:integer('gesture_at').notNull(),chat:text('chat').notNull().default(''),chatAt:integer('chat_at').notNull().default(0)
},t=>[index('visitors_room_seen').on(t.room,t.seen)]);
export const treeDecorations=sqliteTable('tree_decorations',{
 id:text('id').primaryKey(),room:text('room').notNull(),author:text('author').notNull(),kind:text('kind').notNull(),color:text('color').notNull(),angle:real('angle').notNull(),height:real('height').notNull(),originX:real('origin_x'),originY:real('origin_y'),originZ:real('origin_z'),createdAt:integer('created_at').notNull()
},t=>[index('tree_decorations_room').on(t.room)]);
export const spaceOwner=sqliteTable('space_owner',{id:text('id').primaryKey(),userId:text('user_id').notNull()});
export const inviteRooms=sqliteTable('invite_rooms',{id:text('id').primaryKey(),salt:text('salt').notNull(),passwordHash:text('password_hash').notNull(),createdAt:integer('created_at').notNull()});
export const inviteAttempts=sqliteTable('invite_attempts',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),resetAt:integer('reset_at').notNull()});
export const wishes=sqliteTable('wishes',{
 id:text('id').primaryKey(),room:text('room').notNull(),author:text('author').notNull(),authorName:text('author_name').notNull(),message:text('message').notNull(),visibility:text('visibility').notNull().default('public'),createdAt:integer('created_at').notNull()
},t=>[index('wishes_room').on(t.room)]);
export const wishReactions=sqliteTable('wish_reactions',{wishId:text('wish_id').notNull(),author:text('author').notNull()},t=>[index('wish_reactions_wish').on(t.wishId)]);
export const reports=sqliteTable('reports',{id:text('id').primaryKey(),room:text('room').notNull(),reporter:text('reporter').notNull(),targetType:text('target_type').notNull(),targetId:text('target_id').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull(),resolved:integer('resolved').notNull().default(0)},t=>[index('reports_room').on(t.room)]);
export const visitorBlocks=sqliteTable('visitor_blocks',{id:text('id').primaryKey(),createdAt:integer('created_at').notNull()});
export const quizOverrides=sqliteTable('quiz_overrides',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});
export const worldEvents=sqliteTable('world_events',{id:text('id').primaryKey(),title:text('title').notNull(),startsAt:integer('starts_at').notNull(),endsAt:integer('ends_at').notNull(),kind:text('kind').notNull(),enabled:integer('enabled').notNull().default(1)});

export const rideSeats=sqliteTable('ride_seats',{room:text('room').notNull(),kind:text('kind').notNull(),cabin:integer('cabin').notNull(),seat:integer('seat').notNull(),visitor:text('visitor').notNull().unique(),startedAt:integer('started_at').notNull(),expiresAt:integer('expires_at').notNull()},t=>[primaryKey({columns:[t.room,t.kind,t.cabin,t.seat]})]);
