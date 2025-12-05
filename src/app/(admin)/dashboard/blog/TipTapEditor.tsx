"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import { useEffect } from "react";
import styles from "./TipTapEditor.module.css";

export default function TipTapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (content: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Strike,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  // Add Link
  const setLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.toolbar}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? styles.active : ""}><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? styles.active : ""}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? styles.active : ""}><u>U</u></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? styles.active : ""}><s>S</s></button>

        <button onClick={() => editor.chain().focus().setColor("red").run()} style={{ color: "red" }}>A</button>
        <button onClick={() => editor.chain().focus().setColor("blue").run()} style={{ color: "blue" }}>A</button>
        <button onClick={() => editor.chain().focus().setColor("black").run()}>A</button>

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? styles.active : ""}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}>H2</button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? styles.active : ""}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? styles.active : ""}>1. List</button>

        <button onClick={setLink}>🔗 Link</button>
        <button onClick={() => editor.chain().focus().undo().run()}>↶ Undo</button>
        <button onClick={() => editor.chain().focus().redo().run()}>↷ Redo</button>
      </div>

      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  );
}
