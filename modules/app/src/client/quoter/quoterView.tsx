import { Text } from "@radix-ui/themes"

import type { AppAction } from "@app/client/app/appActions"
import { useResponders, type Dispatcher } from "@app/client/framework"
import { QuoterActionTags, type QuoterModel } from "@app/client/quoter/quoterController"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "@app/client/views"

//--- Responders

function onGetRandomQuote(
    dispatch: Dispatcher<AppAction>,
    _model: QuoterModel,
    _event: ViewEvent
) {
    dispatch({ type: QuoterActionTags.GetRandomQuote })
}

//--- Views

export function RandomQuote({ model, dispatch }: { model: QuoterModel, dispatch: Dispatcher<AppAction> }) {
    const message = model.quote ? model.quote.quote : "Want to see a quote?"
    const responders = useResponders(dispatch, model, { onGetRandomQuote })
    return <>
        <ComponentLayout className="bg-slate-300 p-8">
            <Text className="text-4xl">
                {message}
            </Text>
            <ComponentButtonMemo onClick={responders.onGetRandomQuote}>
                <Text className="text-xl">
                    Get Quote
                </Text>
            </ComponentButtonMemo>
        </ComponentLayout>
    </>
}
