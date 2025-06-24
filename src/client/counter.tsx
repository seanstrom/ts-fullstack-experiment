import * as Optics from "optics-ts"
import { create as mutate } from "mutative"
import { Text } from "@radix-ui/themes"

import type { AppModel } from "./app"
import { CounterActionTags, type AppAction, type CounterAction } from "./actions"
import { useModel, useWidget, useResponders, type Dispatcher } from "./framework"
import type { Change, AppEffect, Store } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent, ComponentButton } from "./views"

//--- Models

export type CounterModel = {
    count: number
}

//--- Update

export function updateCounter(model: CounterModel, action: CounterAction): Change<CounterModel, AppEffect> {
    switch (action.type) {
        case CounterActionTags.Increment:
            return { model: mutate(model, draft => { draft.count = model.count + 1 }) }
        case CounterActionTags.Decrement:
            return { model: mutate(model, draft => { draft.count = model.count - 1 }) }
    }
}

//--- Responders

type ButtonMouseEvent = React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>

function onButtonClick(
    dispatch: Dispatcher<CounterAction>,
    model: CounterModel,
    _event: ButtonMouseEvent
) {
    if (model.count > 3 && model.count % 2 === 0) {
        dispatch({ type: CounterActionTags.Decrement })
    } else {
        dispatch({ type: CounterActionTags.Increment })
    }
}

function onIncrement(
    dispatch: Dispatcher<CounterAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Increment })
}

function onDecrement(
    dispatch: Dispatcher<CounterAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Decrement })
}

//--- Views

type CounterLens = Optics.Lens<AppModel, any, CounterModel>

export function CounterWidget({ store, optic: widgetOptic }: { store: Store<AppModel, AppAction>, optic: CounterLens }) {
    const { model, dispatch } = useModel(store, Optics.get(widgetOptic))
    const widget = useWidget(widgetOptic, dispatch, model, updateCounter)
    return <Counter model={widget.model} dispatch={widget.dispatch} />
}

export function Counter({ model, dispatch }: { model: CounterModel, dispatch: Dispatcher<CounterAction> }) {
    const responders = useResponders(dispatch, model, {
        onIncrement,
        onDecrement,
        onButtonClick
    })
    return <>
        <ComponentLayout className="bg-slate-300 p-8 gap-4 rounded-2xl">
            <Text className="text-8xl">{model.count}</Text>
            <ComponentButtonMemo onClick={responders.onIncrement}>
                <Text className="text-md">Increment</Text>
            </ComponentButtonMemo>
            <ComponentButtonMemo onClick={responders.onDecrement}>
                <Text className="text-md">Decrement</Text>
            </ComponentButtonMemo>
            <ComponentButton onClick={responders.onButtonClick}>
                <Text className="text-md">Test</Text>
            </ComponentButton>
        </ComponentLayout>
    </>
}
