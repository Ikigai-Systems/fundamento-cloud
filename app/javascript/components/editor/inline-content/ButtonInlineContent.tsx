import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, useFloating} from '@floating-ui/react';
import {useState} from "react";
import EditButtonPopup from "../../tables/rowstack/EditButtonPopup.tsx";

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
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const {refs, floatingStyles} = useFloating({
        whileElementsMounted: autoUpdate,
        open: isConfigurationOpen,
        onOpenChange: setIsConfigurationOpen,
      });

      return (<>
        <span ref={refs.setReference} className="inline-flex flex-row items-center group">
          <button className="secondary-button z-10">
            Button
          </button>
          {isEditable && <button
            className="flex flex-row items-center secondary-button pl-2.5 py-1 pr-1 -ml-2"
            onClick={() => {
              setIsConfigurationOpen(!isConfigurationOpen);
            }}
          >
            <span className="group-hover:opacity-30 opacity-0 size-7 icon-[heroicons--cog-6-tooth]"></span>
          </button>}
          {isConfigurationOpen && <div ref={refs.setFloating} style={floatingStyles} className="z-[1001] bg-neutral-100">
            <EditButtonPopup/>
          </div>}
        </span>
      </>);
    },
  }
);

export default ButtonInlineContent;