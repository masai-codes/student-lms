import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
    Bold,
    Code2,
    Image,
    Italic,
    Link,
    List,
    ListOrdered,
    SendHorizonal,
    Smile,
    Strikethrough,
    Underline,
    Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function TextEditor() {
    const editor = useEditor({
        extensions: [StarterKit],
        editorProps: {
            attributes: {
                class:
                    "min-h-[120px] outline-none px-3 py-2 text-sm text-gray-800",
            },
        },
        content: "",
    })

    // if (!editor) return null

    const IconButton = ({ onClick, active, children }: any) => (
        <button
            onClick={onClick}
            className={`p-1.5 rounded hover:bg-gray-100 ${active ? "bg-gray-100" : ""
                }`}
        >
            {children}
        </button>
    )

    return (
        <div>
            <div className="rounded-xl border border-gray-300 bg-white">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b bg-[#F9FAFB] rounded-t-xl">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive("bold")}
                    >
                        <Bold size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive("italic")}
                    >
                        <Italic size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <Underline size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive("strike")}
                    >
                        <Strikethrough size={16} />
                    </IconButton>

                    <div className="mx-2 h-4 w-px bg-gray-300" />

                    <IconButton onClick={() => editor.chain().focus().setLink({ href: "" }).run()}>
                        <Link size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List size={16} />
                    </IconButton>

                    <div className="mx-2 h-4 w-px bg-gray-300" />

                    <IconButton>
                        <Smile size={16} />
                    </IconButton>

                    <IconButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    >
                        <Code2 size={16} />
                    </IconButton>

                    <IconButton>
                        <Upload size={16} />
                    </IconButton>

                    <IconButton>
                        <Image size={16} />
                    </IconButton>
                </div>

                {/* Editor */}
                <EditorContent
                    editor={editor}
                    className="relative"
                />
            </div>

            <div className="flex justify-end my-2">
                <Button
                className="
                    flex items-center gap-2
                    bg-[#6962AC] text-white
                    px-6 py-3
                    font-medium
                    hover:bg-[#5A539C] transition-colors"
            >
                Add Response
                <SendHorizonal size={16} strokeWidth={2.2} />
            </Button>
            </div>

        </div>
    )
}
