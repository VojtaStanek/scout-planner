import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AddProgramModal, EditProgramModal } from "./EditProgramModal";
import Timetable from "./Timetable";
import Packages from "./Packages";
import Groups from "./Groups";
import People from "./People";
import Ranges from "./Ranges";
import Rules from "./Rules";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Alert from "react-bootstrap/Alert";
import { clientFactory } from "../Client";
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
import { getPermissions, setAuthenticated } from "../store/authSlice";
import Filters from "./Filters";
import ViewSettings from "./ViewSettings";
import RangesSettings from "./RangesSettings";
import { addError, removeError } from "../store/errorsSlice";
import { getSettings } from "../store/settingsSlice";
import {
  getPeople,
  setLegacyPeople,
  setPeopleMigrationState,
} from "../store/peopleSlice";
import {
  convertLegacyPeople,
  replaceLegacyPeopleInPrograms,
} from "../helpers/PeopleConvertor";
import { migratePeople, migratePrograms } from "../helpers/PeopleMigration";
import { useAuth } from "./AuthProvider";
import { NavLink, Route, Routes } from "react-router-dom";

export default function App() {
  const [violations, setViolations] = useState(new Map());
  const [otherProblems, setOtherProblems] = useState([]);
  const [rulesSatisfied, setRulesSatisfied] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { user, initializing } = useAuth();

  const { groups, loaded: groupsLoaded } = useSelector((state) => state.groups);
  const { ranges, loaded: rangesLoaded } = useSelector((state) => state.ranges);
  const { packages, loaded: packagesLoaded } = useSelector(
    (state) => state.packages
  );
  const { rules, loaded: rulesLoaded } = useSelector((state) => state.rules);
  const { programs, loaded: programsLoaded } = useSelector(
    (state) => state.programs
  );
  const {
    people,
    legacyPeople,
    loaded: peopleLoaded,
    peopleMigrationState,
  } = useSelector((state) => state.people);
  const { settings, loaded: settingsLoaded } = useSelector(
    (state) => state.settings
  );
  const { table, userLevel, permissionsLoaded } = useSelector(
    (state) => state.auth
  );
  const errors = useSelector((state) => state.errors);

  const peopleSection = useSelector((state) => state.config.peopleSection);
  const peopleMigration = useSelector((state) => state.config.peopleMigration);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!permissionsLoaded && !initializing) {
      const client = clientFactory.getClient(table);
      dispatch(getPermissions(client));
    }
  }, [table, permissionsLoaded, initializing, dispatch]);

  useEffect(() => {
    if (permissionsLoaded) {
      const client = clientFactory.getClient(table);

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
    const allPeople = convertLegacyPeople(legacyPeople, people);
    const convertedPrograms = replaceLegacyPeopleInPrograms(
      programs,
      allPeople
    );

    if (peopleMigration && dataLoaded && peopleMigrationState === "idle") {
      const client = clientFactory.getClient(table);
      migratePeople(programs, people, userLevel, client, dispatch);
    } else if (
      peopleMigration &&
      dataLoaded &&
      peopleMigrationState === "finishedPeople"
    ) {
      const client = clientFactory.getClient(table);
      migratePrograms(programs, people, userLevel, client, dispatch);
    } else if (!peopleMigration && dataLoaded) {
      dispatch(setPeopleMigrationState("failedPeople"));
    }

    const problems = checkRules(rules, convertedPrograms, people);

    setViolations(problems.violations);
    setOtherProblems(problems.other);
    setRulesSatisfied(
      [...problems.violations.values()].reduce(
        (acc, curr) => acc && curr.satisfied,
        true
      ) && problems.other.length === 0
    );
  }, [
    table,
    dataLoaded,
    userLevel,
    programs,
    groups,
    packages,
    ranges,
    legacyPeople,
    people,
    rules,
    settings,
    peopleMigration,
    peopleMigrationState,
    dispatch,
  ]);

  useEffect(() => {
    if (
      programsLoaded &&
      rangesLoaded &&
      groupsLoaded &&
      packagesLoaded &&
      rulesLoaded &&
      peopleLoaded &&
      settingsLoaded
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

  useEffect(() => {
    const people = [
      ...new Set(
        [...programs].flatMap((program) =>
          program.people.filter((person) => typeof person === "string")
        )
      ),
    ];
    dispatch(setLegacyPeople(people));
  }, [programs, dispatch]);

  function getTimetableElement() {
    return (
      <>
        {userLevel >= level.VIEW &&
          dataLoaded &&
          (peopleMigrationState === "finishedPrograms" ||
            peopleMigrationState === "failedPrograms" ||
            peopleMigrationState === "failedPeople") && (
            <Timetable violations={violationsPerProgram} />
          )}
        {(!dataLoaded ||
          (peopleMigrationState !== "finishedPrograms" &&
            peopleMigrationState !== "failedPrograms" &&
            peopleMigrationState !== "failedPeople")) && (
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

  return (
    <div className="App">
      {errors.length > 0 && (
        <Container fluid className="notifications">
          <Alert
            variant="danger"
            dismissible
            onClose={() => dispatch(removeError())}
          >
            <i className="fa fa-exclamation-triangle" />
            &nbsp; {errors[0]}
          </Alert>
        </Container>
      )}
      <Routes>
        <Route path="add" element={<AddProgramModal />} />
        <Route path="edit/:id" element={<EditProgramModal />} />
      </Routes>
      <Tab.Container>
        <Nav variant="pills" className="control-panel">
          <Nav.Link as={NavLink} to="" end>
            Harmonogram
          </Nav.Link>
          {userLevel >= level.VIEW && (
            <Nav.Link as={NavLink} to="rules">
              Pravidla{" "}
              {rulesSatisfied ? (
                <i className="fa fa-check text-success" />
              ) : (
                <i className="fa fa-times text-danger" />
              )}
            </Nav.Link>
          )}
          {userLevel >= level.EDIT && (
            <Nav.Link as={NavLink} to="packages" end>
              Balíčky
            </Nav.Link>
          )}
          {userLevel >= level.EDIT && (
            <Nav.Link as={NavLink} to="groups" end>
              Skupiny
            </Nav.Link>
          )}
          {userLevel >= level.EDIT && peopleSection && (
            <Nav.Link as={NavLink} to="people" end>
              Organizátoři
            </Nav.Link>
          )}
          {userLevel >= level.EDIT && (
            <Nav.Link as={NavLink} to="ranges" end>
              Linky
            </Nav.Link>
          )}
          {userLevel >= level.VIEW && (
            <Nav.Link as={NavLink} to="stats" end>
              Statistiky
            </Nav.Link>
          )}
          {userLevel >= level.ADMIN && (
            <Nav.Link as={NavLink} to="users" end>
              Uživatelé
            </Nav.Link>
          )}
          {userLevel >= level.VIEW && (
            <Nav.Link as={NavLink} to="settings" end>
              Nastavení
            </Nav.Link>
          )}
          <Routes>
            <Route
              index
              element={
                <>
                  {userLevel >= level.VIEW && <Filters />}
                  {userLevel >= level.VIEW && <ViewSettings />}
                  {userLevel >= level.VIEW && <RangesSettings />}
                </>
              }
            />
          </Routes>
          <GoogleLogin />
        </Nav>
      </Tab.Container>
      <Routes>
        <Route index element={getTimetableElement()} />
        <Route path="add" element={getTimetableElement()} />
        <Route path="edit/*" element={getTimetableElement()} />
        <Route
          path="rules"
          element={userLevel >= level.VIEW && <Rules violations={violations} />}
        />
        <Route
          path="packages"
          element={userLevel >= level.EDIT && <Packages />}
        />
        <Route path="groups" element={userLevel >= level.EDIT && <Groups />} />
        <Route
          path="people"
          element={userLevel >= level.EDIT && peopleSection && <People />}
        />
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
      </Routes>
    </div>
  );
}

function GoogleLogin() {
  const dispatch = useDispatch();
  const { user, login, logout } = useAuth();

  return !!user ? (
    <Nav.Item>
      <Nav.Link
        as={Button}
        variant="light"
        onClick={() =>
          logout()
            .then(() => dispatch(setAuthenticated(false)))
            .catch((e) => dispatch(addError(e.message)))
        }
      >
        {user.displayName}
        &nbsp;
        <i className="fa fa-sign-out" />
      </Nav.Link>
    </Nav.Item>
  ) : (
    <Nav.Item>
      <Nav.Link
        as={Button}
        variant="light"
        onClick={() =>
          login()
            .then(() => dispatch(setAuthenticated(true)))
            .catch((e) => dispatch(addError(e.message)))
        }
      >
        <i className="fa fa-sign-in" />
      </Nav.Link>
    </Nav.Item>
  );
}
