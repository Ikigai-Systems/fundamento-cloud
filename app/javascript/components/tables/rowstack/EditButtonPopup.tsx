import React from "react";
import Select from 'react-select'
import {StateManagerProps} from "react-select/dist/declarations/src/useStateManager";


function EditButtonPopup({
  column,
  setColumn,
  close,
  rows,
  table,
}) {
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
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px]">
      <div className="p-2 pt-4 uppercase font-medium text-secondary text-xs">
        Button settings
      </div>
      <div className="h-96 overflow-y-auto">
        <div className="border-b py-2">
          <label className="px-2 text-xs">On click</label>
          <StyledSelect
            className="px-2 min-w-64"
            placeholder="Select an action"
            options={[
              {
                options: [
                  {label: "Add row", value: "add_row"},
                  {label: "Add or modify rows", value: "add_or_modify_rows"},
                  {label: "Modify rows", value: "modify_rows"},
                  {label: "Duplicate rows", value: "duplicate_rows"},
                  {label: "Delete rows", value: "delete_rows"},
                ]
              },
              {
                options: [
                  {label: "Copy to clipboard", value: "copy_to_clipboard"},
                  {label: "Duplicate document", value: "duplicate_document"},
                  {label: "Copy space", value: "copy_space"},
                  {label: "Copy document to space", value: "copy_document_to_space"},
                  {label: "Delete rows", value: "delete_rows"},
                ]
              },
              {
                options: [
                  {label: "Open hyperlink", value: "open_hyperlink"},
                  {label: "Open row", value: "open_row"},
                  {label: "Send message or notify user", value: "send_message_or_notify_user"},
                  {label: "Push buttons", value: "push_buttons"},
                  {label: "Sign up for Fundamento", value: "sign_up_for_fundamento"},
                ]
              },
            ]}
          />
        </div>
        <div className="flex flex-col py-2 px-2 border-b">
          <div className="font-medium text-secondary text-sm">Visual</div>
          <label className="mt-2 text-xs">Label</label>
          <input className="rounded border h-8 p-2"/>

          <label className="mt-3 text-xs">Icon</label>
          <input className="rounded border h-8 p-2"/>

          <label className="mt-3 text-xs">Color</label>
          <input className="rounded border h-8 p-2"/>
        </div>
        <div className="flex flex-col py-2 px-2">
          <div className="font-medium text-secondary text-sm">Advanced</div>
          <label className="mt-2 text-xs">Disable if</label>
          <input className="rounded border h-8 p-2"/>

          <label className="mt-3 text-xs">Badge</label>
          <input className="rounded border h-8 p-2 placeholder-neutral-400" placeholder="Enter formula that returns number"/>

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
        </div>
      </div>
    </div>
  </>);
}

export default EditButtonPopup;