import { createRoot } from "react-dom/client"
import { RenderApp, type AppAction, type AppModel } from "@app/client/app/appView"
import * as appController from "@app/client/app/appController"
import { createClientApi, type ClientApi } from "@app/client/api"
import type { AppEffect } from "@app/client/app/appEffects"
import { state, type RootState } from "@app/client/state"
import { createStore, type Store, type EffectAction } from "@app/client/store"

import "@radix-ui/themes/styles.css"
import "@app/client/client.css"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const rootElementId = "root"

function renderRoot(store: Store<AppModel, AppAction>): void {
    state.renderRoot?.render(RenderApp({ store }))
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
}

main(state, rootElementId)
