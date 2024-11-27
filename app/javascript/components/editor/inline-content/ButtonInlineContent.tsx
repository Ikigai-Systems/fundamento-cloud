import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, flip, FloatingPortal, useDismiss, useFloating, useInteractions} from '@floating-ui/react';
import {Placement} from '@floating-ui/utils'
import {useState} from "react";
import ButtonConfiguration from "./button/ButtonConfiguration.tsx";
import FormulasApi from "../../../api/FormulasApi.js";
import createFlash from "../../createFlash.ts";

const ButtonInlineContent = createReactInlineContentSpec(
  {
    type: "button",
    propSchema: {
      // textAlignment: defaultProps.textAlignment,
      // textColor: defaultProps.textColor,
      formula: {
        default: "",
      },
      label: {
        default: "",
      }
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const {formula, label} = props.inlineContent.props;
      const {isEditable} = useBlockNoteEditor();
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const [editedConfiguration, setEditedConfiguration] = useState({formula, label});
      const {refs, floatingStyles, context} = useFloating({
        whileElementsMounted: autoUpdate,
        open: isConfigurationOpen,
        onOpenChange: (open, event, reason) => {
          setIsConfigurationOpen(open);
          if (reason === "escape-key") {
            return;
          }
          props.updateInlineContent({
            type: "button",
            props: {
              formula: editedConfiguration.formula,
              label: editedConfiguration.label,
            }
          });
        },
        middleware: [flip()],
        placement: "bottom-start" as Placement,
      });
      const dismiss = useDismiss(context);
      const {getReferenceProps, getFloatingProps} = useInteractions([
        dismiss,
      ]);

      return (<>
        <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex flex-row items-center group">
          <button className="secondary-button z-10 min-h-9"
            onClick={async () => {
              // todo: disable button during requesting server
              try {
                const formulaResult = await FormulasApi.eval({data: {formula}});
                if (!formulaResult.commands) {
                  createFlash({
                    type: "error",
                    message: "Unable to proceed, invalid action"
                  })
                } else {
                  // todo: process result commands, maybe force refresh updated AdvancedTable in this document
                }
              } catch (e) {
                createFlash({
                  type: "error",
                  message: e.message
                })
              }
            }}
          >
            {label || "Button"}
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
              <ButtonConfiguration
                configuration={editedConfiguration}
                setConfiguration={(updatedConfiguration) => {
                  console.log(updatedConfiguration);
                  setEditedConfiguration(updatedConfiguration)
                }}
              />
            </div>
          </FloatingPortal>}
        </span>
      </>);
    },
  }
);

export default ButtonInlineContent;