import {createReactInlineContentSpec, useBlockNoteEditor} from "@blocknote/react";
import {autoUpdate, flip, FloatingPortal, useDismiss, useFloating, useInteractions} from '@floating-ui/react';
import {Placement} from '@floating-ui/utils'
import {useContext, useEffect, useRef, useState} from "react";
import FormulaConfiguration from "./formula/FormulaConfiguration.tsx";
import FormulasApi from "../../../api/FormulasApi.js";
import createFlash from "../../createFlash.ts";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import handleFormulaResultCommands from "../../formulas/handleFormulaResultCommands.ts";
import clsx from "clsx";
import useAsyncEffect from "use-async-effect";
import {useQuery} from "@tanstack/react-query";

const FormulaInlineContent = createReactInlineContentSpec(
  {
    type: "formula",
    propSchema: {
      formula: {
        default: "",
      },
      id: {
        default: "",
      }
      // - property to determine how to render the formula result, i.e. as slider, as progress, as star-rating, etc
      // displayAs: {
      //   default: "auto",
      //   values: ["auto", "text", "number", "people"],
      // },

      // - optional property to reference this formula from other formulas:
      // name: {
      //   default: "",
      // },
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const {formula, id} = props.inlineContent.props;
      if (id === "") {
        props.updateInlineContent({
          type: "formula",
          props: {
            ...props.inlineContent.props,
            id: crypto.randomUUID(),
          }
        });
      }
      const {isEditable} = useBlockNoteEditor();
      const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
      const [editedConfiguration, setEditedConfiguration] = useState({formula});
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
            type: "formula",
            props: {
              ...props.inlineContent.props,
              formula: editedConfiguration.formula,
            }
          });
        },
        middleware: [flip()],
        placement: "bottom-start" as Placement,
      });

      const {data: formulaResult} = useQuery({
        queryKey: ['formulaInlineContent', id, formula],
        queryFn: async () => {
          if (formula === "" || id === "") {
            return {};
          }

          try {
            setIsExecuting(true);
            const evaluationContext = {
              spaceNpi: space.npi
            };
            const formulaResult = await FormulasApi.eval({data: {formula, evaluationContext}});
            handleFormulaResultCommands(formulaResult, space);
            return formulaResult;
          } catch (e) {
            createFlash({
              type: "error",
              message: e.message,
            });
          } finally {
            setIsExecuting(false);
          }
        }
      })

      const dismiss = useDismiss(context);
      const {getReferenceProps, getFloatingProps} = useInteractions([
        dismiss,
      ]);

      const spanClassNames = clsx(
        "inline-flex items-center group border shadow-sm overflow-hidden bg-gray-100 px-1",
      );

      const configureButtonClassNames = clsx(
        "flex items-center px-1 py-1 border-l -ml-[1px] -mr-1 group-hover:opacity-100 opacity-0 bg-gray-200",
      );

      let displayResult = <span>[]</span>;

      if (formulaResult?.error) {
        displayResult = <span className="text-red-500">{formulaResult.error}</span>
      } else if (formulaResult?.result) {
        displayResult = <span>{JSON.stringify(formulaResult.result)}</span>
      } else if (formulaResult?.commands) {
        displayResult = <div className=""><span className="relative top-0.5 size-4 icon-[heroicons--bolt]"></span>Action</div>
      }

      return (<>
        <span ref={refs.setReference} {...getReferenceProps()} className={spanClassNames}>
          <div className="">
            {isExecuting && <i className={"fa-regular fa-spinner fa-spin mr-2"}/>}
            {!isExecuting && displayResult}
          </div>

          {isEditable && !isExecuting && <button
            className={configureButtonClassNames}
            onClick={() => {
              setIsConfigurationOpen(!isConfigurationOpen);
            }}
          >
            <span className={
              clsx(
                "icon-[heroicons--cog-6-tooth]",
              )
            }/>
          </button>}

          {isConfigurationOpen && <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-neutral-100"
            >
              <FormulaConfiguration
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

export default FormulaInlineContent;