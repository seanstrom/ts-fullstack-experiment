import { createRoot } from "react-dom/client"
import type { AppModel, AppAction } from "./app"
import * as app from "./app"
import * as appController from "./app/appController"
import { createClientApi, type ClientApi } from "./api"
import { state, type RootState } from "./state"
import { createStore, type Store, type EffectAction, type AppEffect } from "./store"

import "@radix-ui/themes/styles.css"
import "./client.css"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(store: Store<AppModel, AppAction>): void {
    state.renderRoot?.render(app.RenderApp(store))
}

async function runEffect(api: ClientApi, effectAction: EffectAction<AppEffect, AppAction>) {
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

function forwardEffects(state: RootState<AppModel, AppAction, AppEffect>) {
    return async (effectAction: EffectAction<AppEffect, AppAction>) => {
        if (state.api) {
            runEffect(state.api, effectAction)
        }
    }
}

function main(state: RootState<AppModel, AppAction, AppEffect>, elementId: string): void {
    console.log(state)
    if (state.renderRoot && state.store) {
        state.controller = appController
        renderRoot(state.store)
    } else {
        const element = document.getElementById(elementId)
        if (element) {
            const rootApp = createRoot(element)
            state.renderRoot = rootApp
            state.api = createClientApi()
            state.controller = appController
            state.store = createStore(state, forwardEffects(state))
            renderRoot(state.store)
        }
    }
    console.log(state)
}

main(state, rootElementId)
