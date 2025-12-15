import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, flip, FloatingPortal, useDismiss, useFloating, useInteractions} from '@floating-ui/react';
import {Placement} from '@floating-ui/utils'
import {useContext, useState} from "react";
import ButtonConfiguration from "./button/ButtonConfiguration.tsx";
import FormulasApi from "../../../api/FormulasApi.js";
import createFlash from "../../createFlash.ts";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import {colorNameToClass, colorNameToHoverAndActiveClass} from "./button/buttonColorUtils.ts";
import handleFormulaResultCommands from "../../formulas/handleFormulaResultCommands.ts";
import clsx from "clsx";

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
        values: ["Small", "Medium", "Large"],
      },
      color: {
        default: "white",
        values: ["green", "orange", "blue", "yellow", "red", "black", "white", "pink", "violet"],
      }
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const {formula, label, size, color} = props.inlineContent.props;
      const {isEditable} = useBlockNoteEditor();
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const [editedConfiguration, setEditedConfiguration] = useState({formula, label, size, color});
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
              color: editedConfiguration.color,
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

      const sizeClassNames = size === "Large" ? {height: "h-10", wrapper: "rounded-2xl", button: "text-lg px-10", cog: "size-8"}
        : (size === "Medium") ? {height: "h-8", wrapper: "rounded-xl", button: "text-md px-8", cog: "size-6"}
          : {height: "h-6", wrapper: "rounded-lg", button: "text-sm px-6", cog: "size-4"}

      const spanClassNames = clsx(
        "inline-flex items-center group border shadow-xs overflow-hidden",
        colorNameToClass(color),
        sizeClassNames.wrapper,
      );

      const buttonClassNames = clsx(
        colorNameToClass(color),
        colorNameToHoverAndActiveClass(color),
        sizeClassNames.height,
        sizeClassNames.button,
        isEditable && !isExecuting && "pr-0",
      );

      const configureButtonClassNames = clsx(
        "flex items-center px-1 py-1 border-l -ml-[1px] group-hover:opacity-100 opacity-0",
        colorNameToClass(color),
        colorNameToHoverAndActiveClass(color),
        sizeClassNames.height,
      );

      const executeButtonFormula = async () => {
        try {
          setIsExecuting(true);

          const formulaResult = await FormulasApi.eval({
            data: {
              formula,
              spaceNpi: space?.npi,
            }
          });

          handleFormulaResultCommands(formulaResult, space);

          if (!formulaResult.commands) {
            createFlash({
              type: "error",
              message: "Unable to proceed, invalid action"
            });
          }
        } catch (e) {
          createFlash({
            type: "error",
            message: e.message,
          });
        } finally {
          setIsExecuting(false);
        }
      };

      return (<>
        <span ref={refs.setReference} {...getReferenceProps()} className={spanClassNames}>
          <button className={buttonClassNames}
            disabled={isExecuting}
            onClick={executeButtonFormula}
          >
            {isExecuting && <i className={"fa-regular fa-spinner fa-spin mr-2"}/>}
            {label || "Button"}
          </button>

          {isEditable && !isExecuting && <button
            className={configureButtonClassNames}
            onClick={() => {
              setIsConfigurationOpen(!isConfigurationOpen);
            }}
          >
            <span className={
              clsx(
                color === "white" ? "bg-gray-400" : "bg-white",
                "icon-[heroicons--cog-6-tooth]",
                sizeClassNames.cog
              )
            }/>
          </button>}

          {isConfigurationOpen && <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <ButtonConfiguration
                configuration={editedConfiguration}
                setConfiguration={(updatedConfiguration) => {
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