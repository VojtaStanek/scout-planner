import { testing } from "./Import";

var client;

const emptyData = {
  programs: [],
  pkgs: [],
  groups: [],
  rules: [],
  ranges: [],
  users: [],
  people: [],
  settings: {},
};

beforeEach(() => {
  const mockAddingFunction = (prefix) =>
    jest
      .fn()
      .mockImplementationOnce(async (a) => ({ ...a, _id: `${prefix}1_new` }))
      .mockImplementationOnce(async (a) => ({ ...a, _id: `${prefix}2_new` }));

  client = {
    updateSettings: jest.fn(async (a) => a),
    addProgram: mockAddingFunction("program"),
    addPackage: mockAddingFunction("pkg"),
    addGroup: mockAddingFunction("group"),
    addRange: mockAddingFunction("range"),
    addPerson: mockAddingFunction("person"),
  };
});

test("empty data", async () => {
  return testing.importData(emptyData, client).then(() => {
    expect(client.updateSettings).toHaveBeenCalledWith({});
  });
});

test("single program", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: [],
        pkg: null,
        people: [],
      },
    ],
  };

  await testing.importData(data, client);

  expect(client.addProgram).toHaveBeenCalledWith(data.programs[0]);
});

test("program with groups", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: ["group1", "group2"],
        pkg: null,
        people: [],
      },
    ],
    groups: [
      {
        _id: "group1",
        table: "table1",
        name: "Group 1",
      },
      {
        _id: "group2",
        table: "table1",
        name: "Group 2",
      },
    ],
  };

  await testing.importData(data, client);

  expect(client.addGroup).toHaveBeenCalledWith(data.groups[0]);
  expect(client.addGroup).toHaveBeenCalledWith(data.groups[1]);
  expect(client.addProgram).toHaveBeenCalledWith({
    ...data.programs[0],
    groups: ["group1_new", "group2_new"],
  });
});

test("program with package", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: [],
        pkg: "pkg1",
        people: [],
      },
    ],
    pkgs: [
      {
        _id: "pkg1",
        table: "table1",
        name: "Test package",
        color: "#ffffff",
      },
    ],
  };
  return testing.importData(data, client).then(() => {
    expect(client.addPackage).toHaveBeenCalledWith(data.pkgs[0]);
    expect(client.addProgram).toHaveBeenCalledWith({
      ...data.programs[0],
      pkg: "pkg1_new",
    });
  });
});

test("program with ranges", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: { range1: 42, range2: 23 },
        groups: [],
        pkg: null,
        people: [],
      },
    ],
    ranges: [
      {
        _id: "range1",
        table: "table1",
        name: "Range 1",
      },
      {
        _id: "range2",
        table: "table1",
        name: "Range 2",
      },
    ],
  };
  return testing.importData(data, client).then(() => {
    expect(client.addRange).toHaveBeenCalledWith(data.ranges[0]);
    expect(client.addRange).toHaveBeenCalledWith(data.ranges[1]);
    expect(client.addProgram).toHaveBeenCalledWith({
      ...data.programs[0],
      ranges: { range1_new: 42, range2_new: 23 },
    });
  });
});

test("program with object people", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: [],
        pkg: null,
        people: [{ person: "person1" }, { person: "person2" }],
      },
    ],
    people: [
      {
        _id: "person1",
        table: "table1",
        name: "Person 1",
      },
      {
        _id: "person2",
        table: "table1",
        name: "Person 2",
      },
    ],
  };
  return testing.importData(data, client).then(() => {
    expect(client.addPerson).toHaveBeenCalledWith(data.people[0]);
    expect(client.addPerson).toHaveBeenCalledWith(data.people[1]);
    expect(client.addProgram).toHaveBeenCalledWith({
      ...data.programs[0],
      people: [{ person: "person1_new" }, { person: "person2_new" }],
    });
  });
});

test("program with string people", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: [],
        pkg: null,
        people: ["Person 1", "Person 2"],
      },
    ],
    people: [
      {
        _id: "person1",
        table: "table1",
        name: "Person 1",
      },
      {
        _id: "person2",
        table: "table1",
        name: "Person 2",
      },
    ],
  };
  return testing.importData(data, client).then(() => {
    expect(client.addPerson).toHaveBeenCalledWith(data.people[0]);
    expect(client.addPerson).toHaveBeenCalledWith(data.people[1]);
    expect(client.addProgram).toHaveBeenCalledWith({
      ...data.programs[0],
      people: ["Person 1", "Person 2"],
    });
  });
});

test("program with mixed people", async () => {
  const data = {
    ...emptyData,
    programs: [
      {
        _id: "program1",
        table: "table1",
        title: "Program 1",
        ranges: {},
        groups: [],
        pkg: null,
        people: [{ person: "person1" }, "Person 2"],
      },
    ],
    people: [
      {
        _id: "person1",
        table: "table1",
        name: "Person 1",
      },
    ],
  };
  return testing.importData(data, client).then(() => {
    expect(client.addPerson).toHaveBeenCalledWith(data.people[0]);
    expect(client.addProgram).toHaveBeenCalledWith({
      ...data.programs[0],
      people: [{ person: "person1_new" }, "Person 2"],
    });
  });
});
