import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, useFloating, useDismiss, useInteractions, FloatingPortal, flip} from '@floating-ui/react';
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
      const inlineContentProps = props.inlineContent.props;
      const {isEditable} = useBlockNoteEditor();
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const {refs, floatingStyles, context} = useFloating({
        whileElementsMounted: autoUpdate,
        open: isConfigurationOpen,
        onOpenChange: setIsConfigurationOpen,
        middleware: [flip()],
        placement: "bottom-start",
      });

      const dismiss = useDismiss(context);

      const {getReferenceProps, getFloatingProps} = useInteractions([
        dismiss,
      ]);

      return (<>
        <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex flex-row items-center group">
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
          {isConfigurationOpen && <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-neutral-100 z-10"
            >
              <EditButtonPopup/>
            </div>
          </FloatingPortal>}
        </span>
      </>);
    },
  }
);

export default ButtonInlineContent;