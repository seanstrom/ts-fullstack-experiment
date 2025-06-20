import { Button, Text } from "grommet"
import { create as mutate } from "mutative"

import { CounterActionTags, type ViewAction, type CounterAction } from "./actions"
import { useModel, useResponder, useResponders, type Dispatcher } from "./framework"
import type { Change, AppEffect, Store, Updater, AppAction, StoreSelector } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "./views"
import type { ViewModel } from "./app"
import { useReducer } from "react"
import { useStore } from "zustand/react"

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

export interface EffectAction<Effect, Action> {
    effect: Effect,
    dispatch: (action: Action) => void
}

const WidgetActionTags = {
    Update: ":widgets/update",
} as const

export interface WidgetUpdate<WidgetModel, WidgetAction extends AppAction, Effect extends AppEffect> {
    type: typeof WidgetActionTags.Update
    widgetId: string
    widgetUpdater: Updater<WidgetModel, WidgetAction, Effect>
    widgetAction: WidgetAction
    widgetChange: Change<WidgetModel, Effect>
}

export type WidgetAction<Model, Action extends AppAction, Effect extends AppEffect> =
    | WidgetUpdate<Model, Action, Effect>

export function useWidget<Model, Action extends AppAction, Effect extends AppEffect>(
    widgetId: string,
    storeDispatch: Dispatcher<WidgetAction<Model, Action, Effect>>,
    widgetModel: Model,
    update: Updater<Model, Action, Effect>,
) {
    const widgetDispatch = useResponder(storeDispatch, widgetModel, (dispatch, model, widgetAction: Action) => {
        const action: WidgetAction<Model, Action, Effect> = {
            type: WidgetActionTags.Update,
            widgetId,
            widgetChange: update(model, widgetAction),
            widgetUpdater: update,
            widgetAction
        }
        dispatch(action)
    })
    return { model: widgetModel, dispatch: widgetDispatch }
}

import * as Optics from "optics-ts"

export function CounterWidget({ store }: { store: Store<ViewModel, ViewAction> }) {
    const widgetId = "counter"
    const widgetOptic = Optics.optic<ViewModel>().prop("widgets").prop(widgetId)
    const widget = useModel(store, state => Optics.get(widgetOptic)(state))
    const { model, dispatch } = useWidget(widgetId, widget.dispatch, widget.model, updateCounter)
    return <Counter model={model} dispatch={dispatch} />
}

export function Counter({ model, dispatch }: { model: CounterModel, dispatch: Dispatcher<CounterAction> }) {
    const responders = useResponders(dispatch, model, {
        onIncrement,
        onDecrement,
        onButtonClick
    })
    return <>
        <ComponentLayout>
            <Text size="77px">
                {model.count}
            </Text>
            <ComponentButtonMemo
                label="Increment"
                onClick={responders.onIncrement}
            />
            <Button
                primary
                label="Decrement"
                onClick={responders.onDecrement}
            />
            <Button
                label="Test"
                onClick={responders.onButtonClick}
            />
        </ComponentLayout>
    </>
}
