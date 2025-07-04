import * as Optics from "optics-ts"
import { memo } from "react"
import { Flex, Theme } from "@radix-ui/themes"

import type { AppModel } from "@app/client/app/appController"
import { ProseMirrorEditor } from "@app/client/exampleEditor/exampleEditorView"
import { CounterWidget } from "@app/client/counter/counterView"
import { RandomQuote } from "@app/client/quoter/quoterView"
import type { Store } from "@app/client/store"

import type { AppAction } from "@app/client/app/appActions"
export type { AppAction } from "@app/client/app/appActions"
export type { AppModel } from "@app/client/app/appController"

export { initApp as init, updateApp as update } from "@app/client/app/appController"

//--- Views

function AppLayout(props: React.PropsWithChildren) {
    return <>
        <Theme>
            <Flex direction="column" justify="center" className="flex-1">
                <Flex direction="row" align="center" p="96px" gap="30px">
                    {props.children}
                </Flex>
            </Flex>
        </Theme>
    </>
}

const RandomQuoteMemo = memo(RandomQuote)
const ProseMirrorEditorMemo = memo(ProseMirrorEditor)
const CounterWidgetMemo = memo(CounterWidget)

const counterLens = Optics.optic<AppModel>().prop("counter")

export function App({ store }: { store: Store<AppModel, AppAction> }) {
    const quoterState = store((state) => state.quoter)
    const editorState = store((state) => state.editor)
    const dispatch = store(state => state.dispatch)
    return <>
        <AppLayout>
            <Flex
                flexGrow="0"
                flexShrink="1"
                className="flex-row content-center">
                <CounterWidgetMemo store={store} optic={counterLens} />
            </Flex>
            <RandomQuoteMemo model={quoterState} dispatch={dispatch} />
            <Flex flexGrow="2" flexShrink="1">
                <ProseMirrorEditorMemo model={editorState} dispatch={dispatch} />
            </Flex>
        </AppLayout>
    </>
}
