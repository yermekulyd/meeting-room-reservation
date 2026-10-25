const DEFAULT_ROOM_TIME_ZONE = "Asia/Almaty";

export function getRoomTimeZone(): string {
  return process.env.ROOM_TIME_ZONE || DEFAULT_ROOM_TIME_ZONE;
}
