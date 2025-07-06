import { createRoot } from "react-dom/client"

import { createClientApi, type ClientApi } from "@app/client/api"
import type { Dispatcher } from "@app/client/framework"
import { state, type RootState } from "@app/client/state"
import { type Store, type EffectAction, AppRunner, createStore } from "@app/client/store"

import * as appController from "@app/client/app/appController"
import type { AppEffect, RpcEffect } from "@app/client/app/appEffects"
import { RenderApp, type AppAction, type AppModel } from "@app/client/app/appView"

import "@radix-ui/themes/styles.css"
import "@app/client/client.css"

if (import.meta.hot) {
    import.meta.hot.accept()
}

//---
//--- Effects Runtime
//---

async function runRpcEffect(api: ClientApi, effect: RpcEffect, dispatch: Dispatcher<AppAction>) {
    // NOTE: needed to dectect the untyped symbol from TRPC until we patch the client library
    if (typeof effect.command.type === "symbol") return
    
    // NOTE: needed to use `any` type to avoid type puzzle with
    // narrowing the response type based on the rpcEffect.
    const sendApiCommand = api[effect.command.type][effect.command.procedure]
    return sendApiCommand(effect.command.input as any)
        .then((data) => ({ type: "ok" as const, data }))
        .catch(error => ({ type: "error" as const, error }))
        .then(response => {
            if (response.type === "error") {
                const responseAction = effect.command.toFailureAction(response.error)
                dispatch(responseAction)
            } else {
                const responseAction = effect.command.toSuccessAction(response.data as any)
                dispatch(responseAction)
            }
            return response
        })
}

async function runEffect(api: ClientApi, effectAction: EffectAction<AppEffect, AppAction>) {
    switch (effectAction.effect.type) {
        case ":effects/rpc": {
            return runRpcEffect(api, effectAction.effect, effectAction.dispatch)
        }
        default: {
            return console.log("Warning: effect not implemented", effectAction.effect)
        }
    }
}

//---
//--- Client Main
//---

const rootElementId = "root"

function renderRoot(store: Store<AppModel, AppAction>): void {
    state.renderRoot?.render(RenderApp({ store }))
}

function main(context: RootState<AppModel, AppAction, AppEffect>, elementId: string): void {
    if (context.renderRoot && context.store) {
        context.controller = appController
        renderRoot(context.store)
    } else {
        const element = document.getElementById(elementId)
        if (element) {
            const rootApp = createRoot(element)
            context.renderRoot = rootApp
            context.api = createClientApi()
            context.controller = appController

            const forwardEffect = (effectAction: EffectAction<AppEffect, AppAction>) => {
                if (context.api) {
                    runEffect(context.api, effectAction)
                }
            }

            const runner = new AppRunner<AppModel, AppAction, AppEffect>(context, forwardEffect)

            const reducerMiddleware = (model: AppModel, action: AppAction) => {
                const change = runner.update(model, action)
                console.log("update change: ", change)
                if (change.effect) {
                    runner.ports.forwardEffect({
                        effect: change.effect,
                        dispatch: runner.ports.dispatch,
                    })
                }
                return change.model
            }

            const initFlags = {}
            const initialChange = runner.init(initFlags)
            const store = createStore(initialChange.model, reducerMiddleware)
            context.store = store

            if (initialChange.effect) {
                runner.ports.forwardEffect({
                    effect: initialChange.effect,
                    dispatch: runner.ports.dispatch,
                })
            }

            renderRoot(context.store)
        }
    }
}

main(state, rootElementId)
