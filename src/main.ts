import { createRoot } from "react-dom/client"
import { initApp, renderApp, updateApp } from "./app"
import type { ViewModel, ViewAction } from "./app"
import { state, type RootState } from "./state"
import { createStore, type Store, type EffectAction } from "./store"
import { createClientApi, type Proc } from "./clientApi"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(store: Store<ViewModel, ViewAction>): void {
    state.root?.render(renderApp(store))
}

function forwardEffects(state: RootState<ViewModel, ViewAction>) {
    return async (effectAction: EffectAction<Proc, ViewAction>) => {
        const effect = effectAction.effect
        if (state.api) {
            switch (effect.type) {
                case "fetchRandomQuote": {
                    const quote = await state.api[effect.type][effect.procedure](effect.input)
                    console.log(quote)
                }
            }
        }
    }
}

function main(state: RootState<ViewModel, ViewAction>, elementId: string): void {
    if (state.root && state.store) {
        renderRoot(state.store)
    } else {
        const element = document.getElementById(elementId)
        if (element) {
            const rootApp = createRoot(element)
            state.root = rootApp
            state.api = createClientApi()
            state.store = createStore(initApp, updateApp, forwardEffects(state))
            renderRoot(state.store)
        }
    }
}

main(state, rootElementId)
