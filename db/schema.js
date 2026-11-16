import {sqliteTable,text,real,integer,index} from 'drizzle-orm/sqlite-core';
export const visitors=sqliteTable('visitors',{
 id:text('id').primaryKey(),room:text('room').notNull(),name:text('name').notNull(),color:text('color').notNull(),accessory:text('accessory').notNull(),x:real('x').notNull(),z:real('z').notNull(),yaw:real('yaw').notNull(),y:real('y').notNull().default(.95),mode:text('mode').notNull().default(''),seen:integer('seen').notNull(),gesture:text('gesture').notNull(),gestureAt:integer('gesture_at').notNull(),chat:text('chat').notNull().default(''),chatAt:integer('chat_at').notNull().default(0)
},t=>[index('visitors_room_seen').on(t.room,t.seen)]);
