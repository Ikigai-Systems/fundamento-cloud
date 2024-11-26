import {createReactBlockSpec, createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";

const ButtonInlineContent = createReactInlineContentSpec(
  {
    type: "button",
    propSchema: {
      // textAlignment: defaultProps.textAlignment,
      // textColor: defaultProps.textColor,
      formula: {
        default: "",
      }
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.inlineContent.props;

      const {isEditable} = useBlockNoteEditor();

      return (<>
        <span className="inline-flex flex-row items-center group">
          <button className="secondary-button z-10">
            Button
          </button>
          {isEditable && <div className="flex flex-row items-center secondary-button pl-2.5 py-1 pr-1 -ml-2">
            <span className="group-hover:opacity-30 opacity-0 size-7 icon-[heroicons--cog-6-tooth]"></span>
          </div>}
        </span>
      </>);
    },
  }
);

export default ButtonInlineContent;