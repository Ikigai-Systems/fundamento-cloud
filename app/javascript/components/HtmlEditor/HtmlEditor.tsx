import '@blocknote/mantine/style.css';
import {CKEditor} from "@ckeditor/ckeditor5-react";
import {
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  Table,
  Undo
} from "ckeditor5";

import 'ckeditor5/ckeditor5.css';

type HtmlEditorProps = {
  initialData: String,
  disabled?: boolean,
}

const HtmlEditor = ({initialData, disabled = false}: HtmlEditorProps) => {
  return (<>
    <CKEditor
      editor={ClassicEditor}
      onReady={editor => {
        window.ckEditor = editor;
      }}
      disabled={disabled}
      config={{
        toolbar: [
          'undo', 'redo', '|',
          'heading', '|', 'bold', 'italic', '|',
          'link', 'insertTable', 'mediaEmbed', '|',
          'bulletedList', 'numberedList', 'indent', 'outdent'
        ],
        plugins: [
          Bold,
          Essentials,
          Heading,
          Indent,
          IndentBlock,
          Italic,
          Link,
          List,
          MediaEmbed,
          Paragraph,
          Table,
          Undo
        ],
        initialData,
        licenseKey: window.FundamentoConfig.ckeditor.licenseKey,
      }}
    />
  </>);
}

export default HtmlEditor;