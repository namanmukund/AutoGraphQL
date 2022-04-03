const CodeEditorConfigLayout = `
  enum CodeEditorConfigLayout {
    row
    column
 }`;

const CodeEditorConfig = `
  type CodeEditorConfig {
   editorMode: EditorMode @default(value: "python")
   layout: CodeEditorConfigLayout @default(value: "row")
   executionAccess: Boolean @default(value: "true")
 }`;

export default [CodeEditorConfigLayout, CodeEditorConfig];
