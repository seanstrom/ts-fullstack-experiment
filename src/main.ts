import { createRoot } from "react-dom/client"
import { initApp, renderApp, updateApp, type ViewModel, type ViewAction } from "./app"
import { state, type RootState } from "./state"
import { createStore, type Store } from "./store"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(store: Store): void {
    state.root?.render(renderApp(store))
}

function main(state: RootState, elementId: string): void {
    if (state.root && state.store) {
        renderRoot(state.store)
    } else {
        const element = document.getElementById(elementId)
        if (element) {
            const rootApp = createRoot(element)
            state.root = rootApp
            state.store = createStore(initApp, updateApp)
            renderRoot(state.store)
        }
    }
}

main(state, rootElementId)
