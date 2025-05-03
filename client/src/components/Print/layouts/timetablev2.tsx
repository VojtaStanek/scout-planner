import React from "react";
import { level } from "../../../helpers/Level";
import { TimetableWrapper } from "../../App";
import { PrintLayout } from "./types";
import { useGroups } from "../../TimetableV2/hooks";
import TimetableV2 from "../../TimetableV2";

interface TimetableV2Options {
  groups: (string | null)[];
}

const timetablev2: PrintLayout<TimetableV2Options> = {
  label: "Klasické v2",
  initialOptions: {
    groups: [],
  },
  OptionsComponent: ({ options, setOptions }) => {
    const groups = useGroups();

    return (
      <div className="mb-3">
        <label>Zobrazit skupiny:</label>
        <div className="d-flex flex-row gap-3 flex-wrap">
          <div className="form-check">
            <input
              type="checkbox"
              id="all-groups"
              name="groups"
              value="all"
              className="form-check-input"
              checked={options.groups.includes(null)}
              onChange={(e) => {
                const checked = e.target.checked;
                setOptions((options) => ({
                  ...options,
                  groups: checked
                    ? [...options.groups, null]
                    : options.groups.filter((g) => g !== null),
                }));
              }}
            />
            <label htmlFor="all-groups" className="form-check-label">
              Bez skupiny
            </label>
          </div>
          {groups.map((group) => (
            <div key={group._id} className="form-check">
              <input
                type="checkbox"
                id={group._id}
                name="groups"
                value={group._id}
                className="form-check-input"
                checked={options.groups.includes(group._id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOptions((options) => ({
                    ...options,
                    groups: checked
                      ? [...options.groups, group._id]
                      : options.groups.filter((g) => g !== group._id),
                  }));
                }}
              />
              <label htmlFor={group._id} className="form-check-label">
                {group.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  },
  validateOptions: (opt): opt is TimetableV2Options => true,
  PrintComponent: ({ violationsPerProgram, options: { groups } }) => (
    <TimetableV2
      printView={true}
      violations={violationsPerProgram}
      timeProvider={null}
      showOnlyGroups={groups.length > 0 ? groups : undefined}
    />
  ),
};

export default timetablev2;
