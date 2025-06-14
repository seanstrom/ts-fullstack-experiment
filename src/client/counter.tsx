import { Button, Text } from "grommet"
import { create as mutate } from "mutative"

import { CounterActionTags, type ViewAction, type CounterAction } from "./actions"
import { useResponders, type Dispatcher } from "./framework"
import { type Change, type AppEffect } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "./views"

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

function onButtonClick(
    dispatch: Dispatcher<ViewAction>,
    model: CounterModel,
    _event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>
) {
    if (model.count > 3 && model.count % 2 === 0) {
        dispatch({ type: CounterActionTags.Decrement })
    } else {
        dispatch({ type: CounterActionTags.Increment })
    }
}

function onIncrement(
    dispatch: Dispatcher<ViewAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Increment })
}

function onDecrement(
    dispatch: Dispatcher<ViewAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Decrement })
}

//--- Views

export function Counter({ model, dispatch }: { model: CounterModel, dispatch: Dispatcher<ViewAction> }) {
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
