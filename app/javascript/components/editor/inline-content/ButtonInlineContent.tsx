import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, flip, FloatingPortal, useDismiss, useFloating, useInteractions} from '@floating-ui/react';
import {Placement} from '@floating-ui/utils'
import {useContext, useState} from "react";
import ButtonConfiguration from "./button/ButtonConfiguration.tsx";
import FormulasApi from "../../../api/FormulasApi.js";
import createFlash from "../../createFlash.ts";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";

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
      },
      size: {
        default: "Small",
        values: ["Small", "Medium", "Large"]
      }
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const {formula, label, size} = props.inlineContent.props;
      const {isEditable} = useBlockNoteEditor();
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const [editedConfiguration, setEditedConfiguration] = useState({formula, label, size});
      const [isExecuting, setIsExecuting] = useState(false);
      const {space} = useContext(CurrentSpaceContext);
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
              size: editedConfiguration.size,
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

      const sizeClassNames = size === "Large" ? {height: "h-10", button: "text-lg px-10", cog: "size-8"}
        : (size === "Medium") ? {height: "h-8", button: "text-md px-8", cog: "size-6"}
          : {height: "h-6", button: "text-sm px-6", cog: "size-4"}

      return (<>
        <span ref={refs.setReference} {...getReferenceProps()} className={`inline-flex flex-row items-center group rounded border shadow-sm ${isExecuting ? "bg-slate-950/5 text-slate-950/40" : "bg-white"}`}>
          <button className={`ignore-default-disabled-styling hover:bg-gray-100 active:bg-gray-200 ${sizeClassNames.height} ${sizeClassNames.button}${isEditable ? " pr-0" : ""}`}
            disabled={isExecuting}
            onClick={async () => {
              try {
                setIsExecuting(true);
                const formulaResult = await FormulasApi.eval({data: {formula}});
                if (!formulaResult.commands) {
                  createFlash({
                    type: "error",
                    message: "Unable to proceed, invalid action"
                  })
                } else {
                  formulaResult.commands.forEach(command => {
                    switch(command.type) {
                    case "AddRow":
                      queryClient.invalidateQueries({queryKey: ["tables", space?.npi, command.tableId]});
                      // todo: show flash message about performed actions, in this case "1 row added" ?
                      break;
                    case "DeleteRows":
                      queryClient.invalidateQueries({queryKey: ["tables", space?.npi, command.tableId]});
                      // todo: show flash message about performed actions, in this case "X rows removed" ? backend (formula_eval_gateway) could provide that number...
                      break;
                    }
                  })
                }
              } catch (e) {
                createFlash({
                  type: "error",
                  message: e.message
                })
              } finally {
                setIsExecuting(false);
              }
            }}
          >
            {label || "Button"}
          </button>
          {isEditable && <button
            className={`ignore-default-disabled-styling flex flex-row items-center px-1 py-1 border-l -ml-[1px] group-hover:opacity-100 opacity-0 hover:bg-gray-100 active:bg-gray-200 ${sizeClassNames.height}`}
            disabled={isExecuting}
            onClick={() => {
              setIsConfigurationOpen(!isConfigurationOpen);
            }}
          >
            <span className={`bg-gray-400 icon-[heroicons--cog-6-tooth] ${sizeClassNames.cog}`}></span>
          </button>}
          {isConfigurationOpen && <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-neutral-100"
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