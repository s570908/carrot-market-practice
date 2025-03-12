import { mergeQueryKeys } from "@lukemorales/query-key-factory";

// import { groupKeys } from './group';
// import { mogacoKeys } from './mogaco';
import { tmapKeys } from "./tmap"; // Ensure that the './tmap' module exists and is correctly named

//export const queryKeys = mergeQueryKeys(groupKeys, mogacoKeys, tmapKeys);
export const queryKeys = mergeQueryKeys(tmapKeys);
