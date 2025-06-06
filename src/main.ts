import { createRoot } from "react-dom/client"
import { renderApp } from "./app"
import { state, type RootState } from "./state"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(state: RootState): void {
    state.root?.render(renderApp(state.context))
}

function main(state: RootState, elementId: string): void {
    if (state.root) {
        renderRoot(state)
    } else {
        const element = document.getElementById(elementId)
        if (element) {
            const rootApp = createRoot(element)
            state.root = rootApp
            renderRoot(state)
        }
    }
}

main(state, rootElementId)
