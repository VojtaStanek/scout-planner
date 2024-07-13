import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./settingsSlice";
import programsReducer from "./programsSlice";
import viewReducer from "./viewSlice";
import authReducer from "./authSlice";
import errorsReducer from "./errorsSlice";
import configReducer from "./configSlice";
import { rangesApi } from "./rangesApi";
import { groupsApi } from "./groupsApi";
import { packagesApi } from "./packagesApi";
import { peopleApi } from "./peopleApi";
import { publicLevelApi } from "./publicLevelApi";
import { rulesApi } from "./rulesApi";
import { usersApi } from "./usersApi";
import { timetableApi } from "./timetableApi";

export function getStore() {
  return configureStore({
    reducer: {
      settings: settingsReducer,
      programs: programsReducer,
      view: viewReducer,
      auth: authReducer,
      errors: errorsReducer,
      config: configReducer,
      [rangesApi.reducerPath]: rangesApi.reducer,
      [groupsApi.reducerPath]: groupsApi.reducer,
      [packagesApi.reducerPath]: packagesApi.reducer,
      [peopleApi.reducerPath]: peopleApi.reducer,
      [publicLevelApi.reducerPath]: publicLevelApi.reducer,
      [rulesApi.reducerPath]: rulesApi.reducer,
      [usersApi.reducerPath]: usersApi.reducer,
      [timetableApi.reducerPath]: timetableApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(rangesApi.middleware)
        .concat(groupsApi.middleware)
        .concat(packagesApi.middleware)
        .concat(peopleApi.middleware)
        .concat(publicLevelApi.middleware)
        .concat(rulesApi.middleware)
        .concat(usersApi.middleware)
        .concat(timetableApi.middleware),
  });
}
