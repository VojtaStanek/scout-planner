import timetable from "./timetable";
import singleDay from "./singleDay";
import { PrintLayout } from "./types";
import timetablev2 from "./timetablev2";

export * from "./types";

export const layouts = {
  timetable,
  singleDay,
  timetablev2,
} as const;
