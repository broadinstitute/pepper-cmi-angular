import {SettingsModel} from "./models/settings.model";
import {ParticipantModel} from "./models/participant.model";
import {createReducer, on} from "@ngrx/store";
import * as SettingsActions from './actions/settings.actions';
import * as ParticipantsActions from './actions/participants.actions';

// Store State Models

export type StorePropsType = {data: SettingsModel | ParticipantObject | {}; isLoaded: boolean;};
export type ParticipantObject = {pts: ParticipantModel[], totalCount: number};

export interface StoreStateModel {
  settings: StorePropsType;
  participants: StorePropsType;
  error: string | null;
}

// Initial State
export const StoreInitialState: StoreStateModel = {
  settings: {
    data: {},
    isLoaded: false
  },
  participants: {
    data: {},
    isLoaded: false
  },
  error: null
}

// Reducer implementation
export const storeReducer = createReducer<StoreStateModel>(
  StoreInitialState,
  on(SettingsActions.getSettingsRequest, (state, _) => {
    return {
      ...state,
      settings: {
        ...state.settings,
        isLoaded: false
      }
    }
  }),
  on(SettingsActions.getSettingsSuccess, (state, action) => {
    return {
      ...state,
      settings: {
        data: action.settings,
        isLoaded: true
      }
    }
  }),
  on(SettingsActions.getSettingsFailure, (state, action) => {
    return {
      ...state,
      settings: {
        ...state.settings,
        isLoaded: false
      },
      error: action.errorMessage,
    }
  }),
  on(ParticipantsActions.getParticipantsRequest, (state, _) => {
    return {
      ...state,
      participants: {
        ...state.participants,
        isLoaded: false,
      }
    }
  }),
  on(ParticipantsActions.getParticipantsSuccess, (state, action) => {
    return {
      ...state,
      participants: {
        isLoaded: true,
        data: {
          pts: action.participants,
          totalCount: action.totalCount
        }
      }
    }
  }),
  on(ParticipantsActions.getParticipantsFailure, (state, action) => {
    return {
      ...state,
      error: action.errorMessage,
      participants: {
        ...state.participants,
        isLoaded: false,
      }
    }
  }),
  on(ParticipantsActions.getParticipantRequest, (state, action) => {
    return {
      ...state,
      participants: {
        ...state.participants,
        isLoaded: false,
      }
    }
  }),
  on(ParticipantsActions.getParticipantSuccess, (state, action) => {
    return {
      ...state,
      participants: {
        isLoaded: true,
        data: {
          ...state.participants.data,
          pts: [action.participant],
        }
      }
    }
  }),
  on(ParticipantsActions.getParticipantsFailure, (state, action) => {
    return {
      ...state,
      error: action.errorMessage,
      participants: {
        ...state.participants,
        isLoaded: false,
      }
    }
  }),
)
