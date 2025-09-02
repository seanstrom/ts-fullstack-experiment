import React, { useState } from 'react'
import { css } from '@emotion/css'
import { createContextState } from 'create-context-state'
import jsx from 'refractor/lang/jsx.js'
import md from 'refractor/lang/markdown.js'
import typescript from 'refractor/lang/typescript.js'
import { ExtensionPriority, getThemeVar } from 'remirror'
import {
    BlockquoteExtension,
    BoldExtension,
    BulletListExtension,
    CodeBlockExtension,
    CodeExtension,
    DocExtension,
    HardBreakExtension,
    HeadingExtension,
    ItalicExtension,
    LinkExtension,
    ListItemExtension,
    MarkdownExtension,
    OrderedListExtension,
    StrikeExtension,
    TableExtension,
    TrailingNodeExtension,
} from 'remirror/extensions'
import {
    Remirror,
    ThemeProvider,
    useHelpers,
    useRemirror,
} from '@remirror/react'
import { extension, PlainExtension } from "@remirror/core"
import { MarkdownEditor } from '@remirror/react-editors/markdown'
import { MarkdownToolbar } from '@remirror/react-ui'
import { createVirtualCursor } from 'prosemirror-virtual-cursor'

import "./remirrorEditorStyles.css"
import "./remirrorThemeStyles.css"
import './remirrorVirtualCursorStyles.css'

const VirtualCursorExtension = extension({})(
    class VirtualCursorExtension extends PlainExtension {
        get name() {
            return 'virtualCursor'
        }

        createExternalPlugins() {
            return [createVirtualCursor()]
        }
    })

function MarkdownPreview() {
    const { getMarkdown } = useHelpers(true);

    return (
        <pre>
            <code>{getMarkdown()}</code>
        </pre>
    )
}

export const Basic = () => (
    <>
        <MarkdownEditor placeholder='Start typing...' initialContent={basicContent}>
            {/* <MarkdownPreview /> */}
        </MarkdownEditor>
    </>
)

const [DualEditorProvider, useDualEditor] = createContextState(({ props }) => ({
    ...props,

    setMarkdown: (text) =>
        props.markdown.getContext()?.setContent({
            type: 'doc',
            content: [
                {
                    type: 'codeBlock',
                    attrs: { language: 'markdown' },
                    content: text ? [{ type: 'text', text }] : undefined,
                },
            ],
        }),
    setVisual: (markdown) => props.visual.getContext()?.setContent(markdown),
}))

const MarkdownTextEditor = () => {
    const { markdown, setVisual } = useDualEditor();

    return (
        <Remirror
            manager={markdown.manager}
            autoRender='end'
            onChange={({ helpers, state }) => {
                const text = helpers.getText({ state });
                return setVisual(text);
            }}
            classNames={[
                css`
          &.ProseMirror {
            padding: 0;

            pre {
              height: 100%;
              padding: ${getThemeVar('space', 3)};
              margin: 0;
            }
          }
        `,
            ]}
        >
            {/* <Toolbar items={toolbarItems} refocusEditor label='Top Toolbar' /> */}
        </Remirror>
    );
};

const VisualEditor = () => {
    const { visual, setMarkdown } = useDualEditor();

    return (
        <Remirror
            autoFocus
            manager={visual.manager}
            autoRender='end'
            onChange={({ helpers, state }) => setMarkdown(helpers.getMarkdown(state))}
            initialContent={visual.state}
            classNames={[
                css`
          &.ProseMirror {
            p,
            h3,
            h4 {
              margin-top: ${getThemeVar('space', 2)};
              margin-bottom: ${getThemeVar('space', 2)};
            }

            h1,
            h2 {
              margin-bottom: ${getThemeVar('space', 3)};
              margin-top: ${getThemeVar('space', 3)};
            }
          }
        `,
            ]}
        >
            {/* <MarkdownToolbar /> */}
        </Remirror>
    );
};

/**
 * The editor which is used to create the annotation. Supports formatting.
 */
export const DualEditor = () => {
    const [isMarkdownVisible, setMarkdownVisible] = useState(false)
    const visual = useRemirror({
        extensions,
        stringHandler: 'markdown',
        content: basicContent,
    })
    const markdown = useRemirror({
        extensions: () => [
            new DocExtension({ content: 'codeBlock' }),
            new CodeBlockExtension({
                supportedLanguages: [md, typescript],
                defaultLanguage: 'markdown',
                syntaxTheme: 'base16_ateliersulphurpool_light',
                defaultWrap: true,
            }),
        ],
        builtin: {
            exitMarksOnArrowPress: false,
        },

        stringHandler: 'html',
    })

    return (
        <DualEditorProvider visual={visual} markdown={markdown}>
            <ThemeProvider>
                <button onClick={() => {
                    setMarkdownVisible(!isMarkdownVisible)
                }}>
                    {isMarkdownVisible ? "Hide Markdown" : "Show Markdown"}
                </button>
                <div className="Editors flex-1">
                    <div className="RichEditor flex-1">
                        <VisualEditor />
                    </div>
                    <div className="RawEditor" style={{ visibility: isMarkdownVisible ? "visible" : "hidden" }}>
                        <MarkdownTextEditor />
                    </div>
                </div>
            </ThemeProvider>
        </DualEditorProvider>
    )
}

const extensions = () => [
    new VirtualCursorExtension({}),
    new LinkExtension({ autoLink: true }),
    new BoldExtension(),
    new StrikeExtension(),
    new ItalicExtension(),
    new HeadingExtension(),
    new BlockquoteExtension(),
    new BulletListExtension({ enableSpine: true }),
    new OrderedListExtension(),
    new ListItemExtension({ priority: ExtensionPriority.High, enableCollapsible: true }),
    new CodeExtension(),
    new CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
    new TrailingNodeExtension(),
    new TableExtension(),
    new MarkdownExtension({ copyAsMarkdown: false }),
    /**
     * `HardBreakExtension` allows us to create a newline inside paragraphs.
     * e.g. in a list item
     */
    new HardBreakExtension(),
]

const basicContent = `
**Markdown** content is the _best_

<br>

# Heading 1

<br>

## Heading 2

<br>

### Heading 3

<br>

#### Heading 4

<br>

##### Heading 5

<br>

###### Heading 6

<br>

> Blockquote

\`\`\`ts
const a = 'asdf';
\`\`\`

playtime is just beginning

## List support

- an unordered
  - list is a thing
    - of beauty

1. As is
2. An ordered
3. List
`

export default Basic;
