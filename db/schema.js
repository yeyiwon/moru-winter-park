import {sqliteTable,text,real,integer,index} from 'drizzle-orm/sqlite-core';
export const visitors=sqliteTable('visitors',{
 id:text('id').primaryKey(),room:text('room').notNull(),name:text('name').notNull(),color:text('color').notNull(),accessory:text('accessory').notNull(),x:real('x').notNull(),z:real('z').notNull(),yaw:real('yaw').notNull(),y:real('y').notNull().default(.95),mode:text('mode').notNull().default(''),seen:integer('seen').notNull(),gesture:text('gesture').notNull(),gestureAt:integer('gesture_at').notNull(),chat:text('chat').notNull().default(''),chatAt:integer('chat_at').notNull().default(0)
},t=>[index('visitors_room_seen').on(t.room,t.seen)]);
export const treeDecorations=sqliteTable('tree_decorations',{
 id:text('id').primaryKey(),room:text('room').notNull(),author:text('author').notNull(),kind:text('kind').notNull(),color:text('color').notNull(),angle:real('angle').notNull(),height:real('height').notNull(),createdAt:integer('created_at').notNull()
},t=>[index('tree_decorations_room').on(t.room)]);
export const spaceOwner=sqliteTable('space_owner',{id:text('id').primaryKey(),userId:text('user_id').notNull()});
export const inviteRooms=sqliteTable('invite_rooms',{id:text('id').primaryKey(),salt:text('salt').notNull(),passwordHash:text('password_hash').notNull(),createdAt:integer('created_at').notNull()});
export const inviteAttempts=sqliteTable('invite_attempts',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),resetAt:integer('reset_at').notNull()});
