import React, {useState} from "react";
import Select from 'react-select'
import {StateManagerProps} from "react-select/dist/declarations/src/useStateManager";
import SelectButtonSize from "./SelectButtonSize.tsx";
import SelectButtonColor from "./SelectButtonColor.tsx";

function ButtonConfiguration({
  configuration,
  setConfiguration,
}) {
  const [advancedSectionExpanded, setAdvancedSectionExpanded] = useState<boolean>(false);

  const StyledSelect = (props: StateManagerProps) => <Select
    {...props}
    styles={{
      control: (base) => ({
        ...base,
        minHeight: 32,
      }),
      dropdownIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
      }),
      clearIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
      }),
      group: (base) => ({
        ...base,
        borderBottom: "solid #e2e8f0 1px",
      }),
      menu: (base) => ({
        ...base,
        width: "calc(100% - 16px)",
      }),
      input: (base) => ({
        ...base,
        "input:focus": {
          boxShadow: "none",
        }
      }),
    }}
  />

  return (<>
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px] min-w-[300px]">
      <div className="p-2 pt-4 uppercase font-medium text-secondary text-xs">
        Button settings
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col px-2 border-b py-2">
          <label className="text-xs">On click</label>
          <input className="bg-white rounded border h-8 p-2 placeholder-neutral-400"
            value={configuration.formula}
            placeholder="Empty formula"
            onChange={(e) => {
              setConfiguration({...configuration, ...{formula: e.target.value}});
            }}
          />
        </div>
        <div className="flex flex-col py-2 px-2 border-b">
          <div className="font-medium text-secondary text-sm">Visual</div>
          <label className="mt-2 text-xs">Label</label>
          <input className="bg-white rounded border h-8 p-2"
            value={configuration.label}
            onChange={(e) => {
              setConfiguration({...configuration, ...{label: e.target.value}});
            }}
          />

          <div className="flex flex-row items-center gap-2">
            <div className="flex flex-col w-full">
              <SelectButtonColor
                value={configuration.color}
                onChange={(newColor) => {
                  setConfiguration({...configuration, ...{color: newColor}});
                }}
              />
            </div>
            <div className="flex flex-col w-full">
              <SelectButtonSize
                value={configuration.size}
                onChange={(newSize) => {
                  setConfiguration({...configuration, ...{size: newSize}});
                }}
              />
            </div>
          </div>
        </div>


        <div className="flex flex-col py-2 px-2">
          <div className="flex flex-row items-center justify-between">
            <div className="font-medium text-secondary text-sm">Advanced</div>
            <button className="bg-neutral-200 rounded-full border hover:opacity-70 active:bg-neutral-300"
              onClick={(e) => {
                setAdvancedSectionExpanded(!advancedSectionExpanded);
              }}
            >
              <div className="size-5 flex items-center justify-center">
                {advancedSectionExpanded
                  ? <span className="p-2 icon-[heroicons--chevron-up]"/>
                  : <span className="p-2 icon-[heroicons--chevron-down]"/>
                }
              </div>
            </button>
          </div>
          {advancedSectionExpanded && (<>
            <label className="mt-2 text-xs">Disable if</label>
            <input className="bg-white rounded border h-8 p-2"/>

            <label className="mt-3 text-xs">Badge</label>
            <input className="bg-white rounded border h-8 p-2 placeholder-neutral-400" placeholder="Enter formula that returns number"/>

            <label className="mt-3 text-xs">Show alert</label>
            <StyledSelect
              className="min-w-64"
              placeholder="Select an action"
              options={[
                {label: "Every time", value: "every_time"},
                {label: "Never", value: "never"},
                {label: "Only for errors", value: "only_for_errors"},
              ]}
            />
          </>)}
        </div>
      </div>
    </div>
  </>);
}

export default ButtonConfiguration;