import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AddProgramModal, EditProgramModal } from "./EditProgramModal";
import Timetable from "./Timetable";
import Packages from "./Packages";
import Groups from "./Groups";
import People from "./People";
import Ranges from "./Ranges";
import Rules from "./Rules";
import Alert from "react-bootstrap/Alert";
import { firestoreClientFactory } from "../FirestoreClient";
import { checkRules } from "../Checker";
import Settings from "./Settings";
import Users from "./Users";
import Stats from "./Stats";
import { level } from "../helpers/Level";
import Container from "react-bootstrap/esm/Container";
import { getRanges } from "../store/rangesSlice";
import { getGroups } from "../store/groupsSlice";
import { getPackages } from "../store/packagesSlice";
import { getRules } from "../store/rulesSlice";
import { getUsers } from "../store/usersSlice";
import { getPrograms } from "../store/programsSlice";
import { getPermissions } from "../store/authSlice";
import { PackageFilter } from "./PackageFilter";
import { ViewSettings } from "./ViewSettings";
import { RangesSettings } from "./RangesSettings";
import { getSettings } from "../store/settingsSlice";
import { getPeople } from "../store/peopleSlice";
import { useAuth } from "./AuthProvider";
import { Route, Routes } from "react-router-dom";
import { PeopleFilter } from "./PeopleFilter";
import { PrintWrapper } from "./PrintOptions";
import { Notifications } from "./Notifications";
import { NavBar } from "./NavBar";

export default function App() {
  const [violations, setViolations] = useState(new Map());
  const [otherProblems, setOtherProblems] = useState([]);
  const [rulesSatisfied, setRulesSatisfied] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { user, initializing } = useAuth();

  const groupsLoaded = useSelector((state) => state.groups.loaded);
  const rangesLoaded = useSelector((state) => state.ranges.loaded);
  const packagesLoaded = useSelector((state) => state.packages.loaded);
  const { rules, loaded: rulesLoaded } = useSelector((state) => state.rules);
  const { programs, loaded: programsLoaded } = useSelector(
    (state) => state.programs,
  );
  const { people, loaded: peopleLoaded } = useSelector((state) => state.people);
  const settingsLoaded = useSelector((state) => state.settings.loaded);
  const { table, userLevel, permissionsLoaded } = useSelector(
    (state) => state.auth,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!permissionsLoaded && !initializing) {
      const client = firestoreClientFactory.getClient(table);
      dispatch(getPermissions(client));
    }
  }, [table, permissionsLoaded, initializing, dispatch]);

  useEffect(() => {
    if (permissionsLoaded) {
      const client = firestoreClientFactory.getClient(table);

      if (userLevel >= level.NONE) {
        dispatch(getPrograms(client));
        dispatch(getRanges(client));
        dispatch(getGroups(client));
        dispatch(getPackages(client));
        dispatch(getRules(client));
        dispatch(getPeople(client));
        dispatch(getSettings(client));
      }

      if (userLevel >= level.ADMIN) dispatch(getUsers(client));
    }
  }, [table, userLevel, permissionsLoaded, dispatch]);

  useEffect(() => {
    if (dataLoaded) {
      const problems = checkRules(rules, programs, people);

      setViolations(problems.violations);
      setOtherProblems(problems.other);
      setRulesSatisfied(
        [...problems.violations.values()].reduce(
          (acc, curr) => acc && curr.satisfied,
          true,
        ) && problems.other.length === 0,
      );
    }
  }, [dataLoaded, programs, people, rules, dispatch]);

  useEffect(() => {
    if (
      (permissionsLoaded && userLevel === level.NONE) ||
      (programsLoaded &&
        rangesLoaded &&
        groupsLoaded &&
        packagesLoaded &&
        rulesLoaded &&
        peopleLoaded &&
        settingsLoaded)
    )
      setDataLoaded(true);
  }, [
    programsLoaded,
    rangesLoaded,
    groupsLoaded,
    packagesLoaded,
    rulesLoaded,
    peopleLoaded,
    settingsLoaded,
    permissionsLoaded,
    userLevel,
  ]);

  const violationsPerProgram = useMemo(() => {
    var tmp = new Map();
    [...violations.values()]
      .filter((val) => !val.satisfied)
      .map((val) => [val.program, val])
      .forEach(([programId, violation]) => {
        if (!tmp.get(programId)) tmp.set(programId, []);
        tmp.get(programId).push(violation);
      });
    otherProblems.forEach((problem) => {
      if (!tmp.get(problem.program)) tmp.set(problem.program, []);
      tmp.get(problem.program).push(problem);
    });
    return tmp;
  }, [violations, otherProblems]);

  return (
    <div className="App">
      <Notifications />
      <Routes>
        <Route path="add" element={<AddProgramModal />} />
        <Route path="edit/:id" element={<EditProgramModal />} />
      </Routes>
      <NavBar rulesSatisfied={rulesSatisfied} />
      <Container fluid className="ms-0 me-0 mb-1">
        <Routes>
          <Route
            index
            element={
              <>
                {userLevel >= level.VIEW && <PackageFilter />}
                {userLevel >= level.VIEW && <PeopleFilter />}
                {userLevel >= level.VIEW && <ViewSettings />}
                {userLevel >= level.VIEW && <RangesSettings />}
              </>
            }
          />
        </Routes>
      </Container>
      <Routes>
        <Route
          index
          element={
            <TimetableWrapper
              dataLoaded={dataLoaded}
              violationsPerProgram={violationsPerProgram}
            />
          }
        />
        <Route
          path="add"
          element={
            <TimetableWrapper
              dataLoaded={dataLoaded}
              violationsPerProgram={violationsPerProgram}
            />
          }
        />
        <Route
          path="edit/*"
          element={
            <TimetableWrapper
              dataLoaded={dataLoaded}
              violationsPerProgram={violationsPerProgram}
            />
          }
        />
        <Route
          path="rules"
          element={userLevel >= level.VIEW && <Rules violations={violations} />}
        />
        <Route
          path="packages"
          element={userLevel >= level.EDIT && <Packages />}
        />
        <Route path="groups" element={userLevel >= level.EDIT && <Groups />} />
        <Route path="people" element={userLevel >= level.EDIT && <People />} />
        <Route path="ranges" element={userLevel >= level.EDIT && <Ranges />} />
        <Route path="stats" element={userLevel >= level.VIEW && <Stats />} />
        <Route
          path="users"
          element={
            userLevel >= level.ADMIN && (
              <Users userEmail={user ? user.email : null} />
            )
          }
        />
        <Route path="settings" element={<Settings />} />
        <Route
          path="print"
          element={
            <PrintWrapper
              dataLoaded={dataLoaded}
              violationsPerProgram={violationsPerProgram}
            />
          }
        />
      </Routes>
    </div>
  );
}

export function TimetableWrapper({
  violationsPerProgram,
  dataLoaded,
  printView = false,
}) {
  const userLevel = useSelector((state) => state.auth.userLevel);

  return (
    <>
      {userLevel >= level.VIEW && dataLoaded && (
        <Timetable violations={violationsPerProgram} printView={printView} />
      )}
      {!dataLoaded && (
        <Container fluid>
          <Alert variant="primary">
            <i className="fa fa-spinner fa-pulse" />
            &nbsp; Načítání&hellip;
          </Alert>
        </Container>
      )}
      {userLevel === level.NONE && dataLoaded && (
        <Container fluid>
          <Alert variant="danger">
            <i className="fa fa-exclamation-triangle" />
            &nbsp; Pro zobrazení tohoto harmonogramu nemáte dostatečná
            oprávnění.
          </Alert>
        </Container>
      )}
    </>
  );
}
