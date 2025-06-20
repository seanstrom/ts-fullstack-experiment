import { type Command, EditorState, Transaction } from "prosemirror-state";
import {
    schema,
    defaultMarkdownParser,
    defaultMarkdownSerializer
} from "prosemirror-markdown"
import {
    inputRules, wrappingInputRule, textblockTypeInputRule,
    smartQuotes, emDash, ellipsis
} from "prosemirror-inputrules"
import { NodeType, Schema } from "prosemirror-model"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"


import { type ViewAction, type EditorAction, EditorActionTags } from "./actions"
import { useResponders, type Dispatcher } from "./framework"
import type { Change, AppEffect } from "./store"

import "./exampleEditor.css"


/// Given a blockquote node type, returns an input rule that turns `"> "`
/// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType)
}

/// Given a list node type, returns an input rule that turns a number
/// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType: NodeType) {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order == +match[1])
}

/// Given a list node type, returns an input rule that turns a bullet
/// (dash, plush, or asterisk) at the start of a textblock into a
/// bullet list.
export function bulletListRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

/// Given a code block node type, returns an input rule that turns a
/// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType: NodeType) {
    return textblockTypeInputRule(/^```$/, nodeType)
}

/// Given a node type and a maximum level, creates an input rule that
/// turns up to that number of `#` characters followed by a space at
/// the start of a textblock into a heading whose level corresponds to
/// the number of `#` signs.
export function headingRule(nodeType: NodeType, maxLevel: number) {
    return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"),
        nodeType, match => ({ level: match[1].length }))
}

/// A set of input rules for creating the basic block quotes, lists,
/// code blocks, and heading.
export function buildInputRules(schema: Schema) {
    let rules = smartQuotes.concat(ellipsis, emDash), type
    if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type))
    if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type))
    if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type))
    if (type = schema.nodes.code_block) rules.push(codeBlockRule(type))
    if (type = schema.nodes.heading) rules.push(headingRule(type, 6))
    return inputRules({ rules })
}

import {
    ProseMirror,
    ProseMirrorDoc,
    reactKeys,
} from "@handlewithcare/react-prosemirror";
import { useState } from "react";

import {
    wrapIn, setBlockType, chainCommands, toggleMark, exitCode,
    joinUp, joinDown, lift, selectParentNode
} from "prosemirror-commands"
import { wrapInList, splitListItem, liftListItem, sinkListItem } from "prosemirror-schema-list"
import { undo, redo } from "prosemirror-history"
import { undoInputRule } from "prosemirror-inputrules"

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false

/// Inspect the given schema looking for marks and nodes from the
/// basic schema, and if found, add key bindings related to them.
/// This will add:
///
/// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
/// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
/// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
/// * **Ctrl-Shift-0** for making the current textblock a paragraph
/// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
///   textblock a heading of the corresponding level
/// * **Ctrl-Shift-Backslash** to make the current textblock a code block
/// * **Ctrl-Shift-8** to wrap the selection in an ordered list
/// * **Ctrl-Shift-9** to wrap the selection in a bullet list
/// * **Ctrl->** to wrap the selection in a block quote
/// * **Enter** to split a non-empty textblock in a list item while at
///   the same time splitting the list item
/// * **Mod-Enter** to insert a hard break
/// * **Mod-_** to insert a horizontal rule
/// * **Backspace** to undo an input rule
/// * **Alt-ArrowUp** to `joinUp`
/// * **Alt-ArrowDown** to `joinDown`
/// * **Mod-BracketLeft** to `lift`
/// * **Escape** to `selectParentNode`
///
/// You can suppress or map these bindings by passing a `mapKeys`
/// argument, which maps key names (say `"Mod-B"` to either `false`, to
/// remove the binding, or a new key name string.
export function buildKeymap(schema: Schema, mapKeys?: { [key: string]: false | string }) {
    let keys: { [key: string]: Command } = {}, type
    function bind(key: string, cmd: Command) {
        if (mapKeys) {
            let mapped = mapKeys[key]
            if (mapped === false) return
            if (mapped) key = mapped
        }
        keys[key] = cmd
    }

    bind("Mod-z", undo)
    bind("Shift-Mod-z", redo)
    bind("Backspace", undoInputRule)
    if (!mac) bind("Mod-y", redo)

    bind("Alt-ArrowUp", joinUp)
    bind("Alt-ArrowDown", joinDown)
    bind("Mod-BracketLeft", lift)
    bind("Escape", selectParentNode)

    if (type = schema.marks.strong) {
        bind("Mod-b", toggleMark(type))
        bind("Mod-B", toggleMark(type))
    }
    if (type = schema.marks.em) {
        bind("Mod-i", toggleMark(type))
        bind("Mod-I", toggleMark(type))
    }
    if (type = schema.marks.code)
        bind("Mod-`", toggleMark(type))

    if (type = schema.nodes.bullet_list)
        bind("Shift-Ctrl-8", wrapInList(type))
    if (type = schema.nodes.ordered_list)
        bind("Shift-Ctrl-9", wrapInList(type))
    if (type = schema.nodes.blockquote)
        bind("Ctrl->", wrapIn(type))
    if (type = schema.nodes.hard_break) {
        let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
            return true
        })
        bind("Mod-Enter", cmd)
        bind("Shift-Enter", cmd)
        if (mac) bind("Ctrl-Enter", cmd)
    }
    if (type = schema.nodes.list_item) {
        bind("Enter", splitListItem(type))
        bind("Mod-[", liftListItem(type))
        bind("Mod-]", sinkListItem(type))
    }
    if (type = schema.nodes.paragraph)
        bind("Shift-Ctrl-0", setBlockType(type))
    if (type = schema.nodes.code_block)
        bind("Shift-Ctrl-\\", setBlockType(type))
    if (type = schema.nodes.heading)
        for (let i = 1; i <= 6; i++) bind("Shift-Ctrl-" + i, setBlockType(type, { level: i }))
    if (type = schema.nodes.horizontal_rule) {
        let hr = type
        bind("Mod-_", (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView())
            return true
        })
    }

    return keys
}

function buildPlugin(options: {
    schema: Schema,
    mapKeys?: { [key: string]: string | false }
}) {
    return [
        reactKeys(),
        buildInputRules(options.schema),
        keymap(buildKeymap(options.schema, options.mapKeys)),
        keymap(baseKeymap),
    ]
}

const editorPlugins = buildPlugin({ schema: schema })

export type EditorModel = {
    state: EditorState
}

export function initEditor(markdownContent: string): EditorModel {
    const state = EditorState.create({
        schema,
        doc: defaultMarkdownParser.parse(markdownContent),
        plugins: editorPlugins
    })

    return { state }
}

export function updateEditor(model: EditorModel, action: EditorAction): Change<EditorModel, AppEffect> {
    switch (action.type) {
        case EditorActionTags.UpdateState: {
            const newState = model.state.apply(action.transaction)
            return {
                model: { state: newState },
            }
        }
    }
}

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

export function ProseMirrorEditor({ model, dispatch }: { model: EditorModel, dispatch: Dispatcher<ViewAction> }) {
    const responders = useResponders(dispatch, model, { onUpdateState})
    return (
        <ProseMirror defaultState={model.state} dispatchTransaction={responders.onUpdateState}>
            <ProseMirrorDoc />
        </ProseMirror>
    );
}
