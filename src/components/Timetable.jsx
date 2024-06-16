import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSelector } from "react-redux";
import { firestoreClientFactory } from "../FirestoreClient";
import { level } from "../helpers/Level";
import { updateProgram } from "../store/programsSlice";
import { getTimeIndicatorRect, TimeIndicator } from "./TimeIndicator";
import { getTimetableSettings } from "../helpers/TimetableSettings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Droppables } from "./Droppables";
import { DateHeaders, GroupHeaders, TimeHeaders } from "./Headers";
import { Blocks } from "./Blocks";
import { Tray } from "./Tray";
import { useCommandHandler } from "./CommandContext";
import { useGetGroupsSlice } from "../store/groupsSlice";

export default function Timetable({
  violations,
  timeProvider = null,
  printView = false,
}) {
  const { dispatchCommand } = useCommandHandler();
  const { programs } = useSelector((state) => state.programs);

  const { table, userLevel } = useSelector((state) => state.auth);
  const client = useMemo(
    () => firestoreClientFactory.getClient(table),
    [table],
  );

  const onDroppableDrop = useCallback(
    (item, begin, groupId, currentPrograms) => {
      var prog = currentPrograms.find((program) => program._id === item.id);
      if (prog) {
        // single-group programs should be always updated according to the target group,
        // multi-group programs should be only updated in case they are dragged to a new group
        const groups =
          !groupId || prog.groups.indexOf(groupId) !== -1
            ? prog.groups
            : [groupId];

        dispatchCommand(client, updateProgram({ ...prog, begin, groups }));
      }
    },
    [client, dispatchCommand],
  );

  const { data: groups, isSuccess: groupsLoaded } = useGetGroupsSlice(
    table,
    false,
  );
  const { settings: timetableSettings } = useSelector(
    (state) => state.settings,
  );
  const settings = useMemo(
    () =>
      getTimetableSettings(
        programs,
        groupsLoaded ? groups : [],
        timetableSettings.timeStep,
        timeProvider ? timeProvider() : Date.now(),
      ),
    [programs, groups, timetableSettings, timeProvider],
  );

  const [time, setTime] = useState(timeProvider ? timeProvider() : Date.now());

  useEffect(() => {
    const interval = setInterval(
      () => setTime(timeProvider ? timeProvider() : Date.now()),
      (1000 * timetableSettings.timeStep) / 2,
    );

    return () => clearInterval(interval);
  }, []);

  const timeIndicatorRect = getTimeIndicatorRect(settings, time);

  const width = useSelector((state) => state.settings.settings.width);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="timetable"
        style={{
          gridTemplateRows:
            "repeat(" +
            (settings.days.length * settings.groupCnt + 1) +
            ", auto)",
          gridTemplateColumns:
            "auto auto repeat(" +
            settings.timeSpan * settings.timeHeaders.length +
            ", minmax(" +
            (width * 20) / 100 +
            "px, 1fr))",
        }}
      >
        {userLevel >= level.EDIT && (
          <Droppables settings={settings} onDrop={onDroppableDrop} />
        )}
        <TimeHeaders settings={settings} />
        <DateHeaders settings={settings} />
        <GroupHeaders settings={settings} />
        <Blocks
          settings={settings}
          violations={violations}
          onDrop={onDroppableDrop}
        />
        {timeIndicatorRect && (
          <TimeIndicator
            x={timeIndicatorRect.x}
            y={timeIndicatorRect.y}
            height={timeIndicatorRect.height}
          />
        )}
      </div>
      {!printView && (
        <Tray
          settings={settings}
          programs={programs}
          onDroppableDrop={onDroppableDrop}
        />
      )}
    </DndProvider>
  );
}
