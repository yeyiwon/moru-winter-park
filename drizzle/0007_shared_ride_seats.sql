CREATE TABLE IF NOT EXISTS ride_seats (
 room TEXT NOT NULL,
 kind TEXT NOT NULL,
 cabin INTEGER NOT NULL,
 seat INTEGER NOT NULL CHECK(seat IN (0,1)),
 visitor TEXT NOT NULL UNIQUE,
 started_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 PRIMARY KEY(room,kind,cabin,seat)
);
