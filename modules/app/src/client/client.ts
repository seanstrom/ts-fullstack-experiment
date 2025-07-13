import { createRoot, type Root } from "react-dom/client"

import { createClientApi } from "@app/client/api"
import { runRpcEffect, runTimeEffect, runCustomEffect } from "@app/client/clientEffects"
import { stateRef, type RootState } from "@app/client/state"
import { type Store, AppRunner, type Effector } from "@app/client/store"

import * as appController from "@app/client/app/appController"
import type { AppEffect } from "@app/client/app/appEffects"
import { RenderApp, type AppAction, type AppModel } from "@app/client/app/appView"

import "@radix-ui/themes/styles.css"
import "@app/client/client.css"

if (import.meta.hot) {
    import.meta.hot.accept()
}

const forwardEffect: Effector<AppEffect, AppAction> = async (context, effectAction) => {
    switch (effectAction.effect.type) {
        case ":effects/rpc": {
            runRpcEffect(context.api, effectAction.effect, effectAction.dispatch)
            break
        }
        case ":effects/time": {
            runTimeEffect(effectAction.effect, effectAction.dispatch)
            break
        }
        case ":effects/custom": {
            runCustomEffect(effectAction.effect, effectAction.dispatch)
            break
        }
        default: {
            console.log("Warning: effect not implemented", effectAction.effect)
        }
    }

}

//---
//--- Client Main
//---

const rootElementId = "root"

function renderApp(rootElement: Root, store: Store<AppModel, AppAction>): void {
    rootElement.render(RenderApp({ store }))
}

function main(
    stateRef: { ref: RootState<AppModel, AppAction, AppEffect> | null },
    elementId: string
): void {
    try {
        if (stateRef.ref) {
            stateRef.ref.runner.controller = appController
            stateRef.ref.runner.forwardEffect = forwardEffect
            renderApp(stateRef.ref.rootElement, stateRef.ref.store)
        }
        else {
            const element = document.getElementById(elementId)
            if (!element) {
                const error = {
                    type: "error" as const,
                    message: `"Missing Element by ID" ${elementId}`
                }
                throw error
            }

            const runner = new AppRunner(createClientApi(), appController, forwardEffect)

            const initFlags = {}
            const { store } = runner.init(initFlags)
            const rootElement = createRoot(element)

            stateRef.ref = {
                rootElement,
                store,
                runner,
            }

            renderApp(stateRef.ref.rootElement, stateRef.ref.store)
        }
    }
    catch (error) {
        console.error(error)
    }
}

main(stateRef, rootElementId)
