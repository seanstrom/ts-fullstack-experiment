import { describe, it, expect } from "vitest"
import { optic } from "optics-ts"
import { create as mutate } from "mutative"

import {
    CounterActionTags,
    WidgetActionTags,
    type CounterAction,
} from "@app/client/actions"

import { initApp, updateApp, type AppModel } from "@app/client/app/appController"

describe("Update App function", () => {
    it("returns a change to the widget model", () => {
        const appModel = initApp().model

        const widgetAction: CounterAction = {
            type: CounterActionTags.Increment
        }

        const widgetOptic = optic<AppModel>().prop("counter")

        const appAction = {
            type: WidgetActionTags.Update,
            widgetOptic,
            widgetAction,
            widgetChange: {
                model: { count: 1 },
            }
        }

        const appChange = updateApp(appModel, appAction)

        expect(appChange.model).toEqual(mutate(appModel, (model) => {
            model.counter = appAction.widgetChange.model
        }))
    })

    it("returns a change to the widget model", () => {
        const appModel = initApp().model

        const widgetAction: CounterAction = {
            type: CounterActionTags.Increment
        }

        const widgetOptic = optic<AppModel>().prop("widgets").prop("counters").prop("counter-id-1")

        const appAction = {
            type: WidgetActionTags.Update,
            widgetOptic,
            widgetAction,
            widgetChange: {
                model: { count: 1 },
            }
        }

        const appChange = updateApp(appModel, appAction)

        expect(appChange.model).toEqual(mutate(appModel, (model) => {
            model.widgets.counters["counter-id-1"] = appAction.widgetChange.model
        }))
    })
})
