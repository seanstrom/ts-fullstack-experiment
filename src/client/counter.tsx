import { Button, Text } from "grommet"
import { create as mutate } from "mutative"

import { CounterActionTags, WidgetActionTags, type ViewAction, type CounterAction } from "./actions"
import { useModel, useResponder, useResponders, type Dispatcher } from "./framework"
import type { Change, AppEffect, Store, Updater, AppAction } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "./views"
import type { ViewModel } from "./app"

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

export interface WidgetUpdate<ViewModel, WidgetModel, WidgetAction extends AppAction, Effect extends AppEffect> {
    type: typeof WidgetActionTags.Update
    widgetOptic: Optics.Lens<ViewModel, any, WidgetModel>
    widgetAction: WidgetAction
    widgetChange: Change<WidgetModel, Effect>
}

export type WidgetAction<Model, WidgetModel, Action extends AppAction, Effect extends AppEffect> =
    | WidgetUpdate<Model, WidgetModel, Action, Effect>

export function useWidget<Model, WidgetModel, Action extends AppAction, Effect extends AppEffect>(
    widgetOptic: Optics.Lens<Model, any, WidgetModel>,
    storeDispatch: Dispatcher<WidgetAction<Model, WidgetModel, Action, Effect>>,
    widgetModel: WidgetModel,
    update: Updater<WidgetModel, Action, Effect>,
) {
    const widgetDispatch = useResponder(storeDispatch, widgetModel, (dispatch, model, widgetAction: Action) => {
        const change = update(model, widgetAction)
        const action: WidgetAction<Model, WidgetModel, Action, Effect> = {
            type: WidgetActionTags.Update,
            widgetOptic,
            widgetChange: change,
            widgetAction
        }
        dispatch(action)
    })
    return { model: widgetModel, dispatch: widgetDispatch }
}

import * as Optics from "optics-ts"

type CounterLens = Optics.Lens<ViewModel, any, CounterModel>

export function CounterWidget({ store, optic: widgetOptic }: { store: Store<ViewModel, ViewAction>, optic: CounterLens }) {
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
