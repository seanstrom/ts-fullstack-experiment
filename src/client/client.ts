import { createRoot } from "react-dom/client"
import { initApp, renderApp, updateApp, type ViewModel, type ViewAction } from "./app"
import { createClientApi, type ClientApi } from "./api"
import { state, type RootState } from "./state"
import { createStore, type Store, type EffectAction, type AppEffect } from "./store"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(store: Store<ViewModel, ViewAction>): void {
    state.root?.render(renderApp(store))
}

async function runEffect(api: ClientApi, effectAction: EffectAction<AppEffect, ViewAction>) {
    const effect = effectAction.effect
    switch (effect.type) {
        case ":effects/rpc": {
            const rpcEffect = effect.command
            switch (rpcEffect.type) {
                case "fetchRandomQuote": {
                    const response = await api[rpcEffect.type][rpcEffect.procedure](rpcEffect.input)
                    effectAction.dispatch({
                        type: ":quoter/GotRandomQuote",
                        quote: response
                    })
                    return response
                }
                case "hello": {
                    const response = await api[rpcEffect.type][rpcEffect.procedure](rpcEffect.input)
                    return response
                }
                default: {
                    return console.log("Warning: rpc effect not implemented")
                }
            }
        }
        default: {
            return console.log("Warning: effect not implemented", effect)
        }
    }
}

function forwardEffects(state: RootState<ViewModel, ViewAction>) {
    return async (effectAction: EffectAction<AppEffect, ViewAction>) => {
        if (state.api) {
            runEffect(state.api, effectAction)
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
