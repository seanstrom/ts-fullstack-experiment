import { type Root } from "react-dom/client"
import { type Store } from "./store"

export interface RootState {
    root?: Root
    store?: Store
}

export const state: RootState = {
    root: undefined,
    store: undefined,
}
