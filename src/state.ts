import { type Root } from "react-dom/client"

export interface RootState {
    root?: Root
    context: any
}

export const state: RootState = {
    root: undefined,
    context: {
        count: 0
    }
}
