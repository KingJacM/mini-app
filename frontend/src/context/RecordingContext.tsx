import React, {
    createContext,
    useContext,
    useReducer,
    useEffect,
    ReactNode,
  } from "react";
  
  type Phase =
    | "READY"
    | "COUNTDOWN"
    | "RECORDING"
    | "REVIEW"
    | "UPLOADING";
  
  interface State {
    phase: Phase;
    countdown: number; // 3 → 2 → 1
    timer: number;     // seconds while recording
    blob?: Blob;
  }
  
  type Action =
    | { type: "START_COUNTDOWN" }
    | { type: "TICK_COUNTDOWN" }
    | { type: "START_RECORDING" }
    | { type: "STOP_RECORDING"; blob: Blob }
    | { type: "DISCARD" }
    | { type: "UPLOAD_START" }
    | { type: "UPLOAD_SUCCESS" }
    | { type: "UPLOAD_FAIL" }
    | { type: "TICK_TIMER" }; // ✅ add
    
  
  const initial: State = { phase: "READY", countdown: 3, timer: 0 };
  
  const Ctx = createContext<{
    state: State;
    dispatch: React.Dispatch<Action>;
  }>({ state: initial, dispatch: () => null });
  
  function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "START_COUNTDOWN":
          return { ...state, phase: "COUNTDOWN", countdown: 3 };
        case "TICK_COUNTDOWN":
          return { ...state, countdown: state.countdown - 1 };
        case "START_RECORDING":
          return { ...state, phase: "RECORDING", timer: 0 };
        case "TICK_TIMER":
          return { ...state, timer: state.timer + 1 };   // ✅ add
        case "STOP_RECORDING":
          return { ...state, phase: "REVIEW", blob: action.blob };
        case "DISCARD":
          return initial;
        case "UPLOAD_START":
          return { ...state, phase: "UPLOADING" };
        case "UPLOAD_SUCCESS":
          return initial;
        case "UPLOAD_FAIL":
          return { ...state, phase: "REVIEW" };
        default:
          return state;
      }    
  }
  
  export function RecordingProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initial);

  /* increment timer once per second while recording */
  useEffect(() => {
    if (state.phase !== "RECORDING") return;
    const id = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1_000);
    return () => clearInterval(id);
  }, [state.phase]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;

  }
  
  export function useRecording() {
    return useContext(Ctx);
  }
  