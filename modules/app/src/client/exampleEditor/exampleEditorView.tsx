import { Transaction } from "prosemirror-state";
import { ProseMirror, ProseMirrorDoc } from "@handlewithcare/react-prosemirror"

import type { AppAction } from "@app/client/app/appActions"
import { useResponders, type Dispatcher } from "@app/client/framework"
import type { EditorAction, EditorModel } from "@app/client/exampleEditor/exampleEditorController"

import "@app/client/exampleEditor/exampleEditorStyles.css"

//--- Responders

function onUpdateState(
    dispatch: Dispatcher<EditorAction>,
    _model: EditorModel,
    tx: Transaction
) {
    // dispatch({
    //     type: EditorActionTags.UpdateState,
    //     editorId: "markdown",
    //     transaction: tx
    // })
}

//--- Views

export function ProseMirrorEditor({ model, dispatch }: { model: EditorModel, dispatch: Dispatcher<AppAction> }) {
    const responders = useResponders(dispatch, model, { onUpdateState })
    return (
        <ProseMirror defaultState={model.state} dispatchTransaction={responders.onUpdateState}>
            <ProseMirrorDoc />
        </ProseMirror>
    );
}
