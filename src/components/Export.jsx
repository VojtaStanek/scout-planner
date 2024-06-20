import React from "react";
import Form from "react-bootstrap/Form";
import { useSelector } from "react-redux";
import { useGetRangesQuery } from "../store/rangesApi";
import { useGetRangesSlice } from "../store/rangesSlice";
import { useGetPackagesSlice } from "../store/packagesSlice";
import { useGetGroupsSlice } from "../store/groupsSlice";
import { useGetPeopleSlice } from "../store/peopleSlice";
import { useGetRulesSlice } from "../store/rulesSlice";

export default function Export() {
  const table = useSelector((state) => state.auth.table);
  const rtkQuery = useSelector((state) => state.config.rtkQuery);

  const { data: groups } = useGetGroupsSlice(table, false);
  const { data: oldRanges } = useGetRangesSlice(table, rtkQuery);
  const { data: newRanges } = useGetRangesQuery(table, rtkQuery);
  const ranges = rtkQuery ? newRanges : oldRanges;
  const { data: packages } = useGetPackagesSlice(table, false);
  const { data: rules } = useGetRulesSlice(table, false);
  const users = useSelector((state) => state.users.users);
  const settings = useSelector((state) => state.settings.settings);
  const { data: people } = useGetPeopleSlice(table, false);
  const { programs, deletedPrograms } = useSelector((state) => state.programs);

  const data = JSON.stringify({
    programs: [...programs, ...deletedPrograms],
    pkgs: packages,
    groups,
    rules,
    ranges,
    users,
    settings,
    people,
  });

  return (
    <Form.Group className="mb-3">
      <Form.Label>Exportovaná data:</Form.Label>
      <Form.Control as="textarea" value={data} readOnly />
    </Form.Group>
  );
}
