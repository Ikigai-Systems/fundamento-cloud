import {createReactBlockSpec} from "@blocknote/react";
import ReactCodeMirror from "@uiw/react-codemirror";

const CodeBlock = createReactBlockSpec({
  type: "procode",
  propSchema: {
    data: {
      default: ""
    }
  },
  content: "none",
}, {
  render: (props) => {
    return <ReactCodeMirror
      placeholder="Enter your code here"
      className={"border w-full"}
      height="auto"
      editable={props.editor.isEditable}
      onChange={(value) => {
        props.editor.updateBlock(props.block, {
          props: {
            data: value
          },
        })
        console.log(value);
      }}
      value={props.block.props.data}
    />
  }
});

export default CodeBlock;