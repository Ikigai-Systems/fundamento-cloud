import {defaultProps} from "@blocknote/core";
import {createReactBlockSpec} from "@blocknote/react";
import Table, {EVALUATION_LICENSE} from "rowstack";
import {useState} from "react";

const sampleData = [
  {
    id: "0",
    name: "Uriel Russo",
    email: "dolor.vitae@icloud.ca"
  },
  {
    id: "1",
    name: "Priscilla Whitehead",
    email: "egestas.aliquam@icloud.ca"
  },
  {
    id: "2",
    name: "Mariam Christensen",
    email: "lectus@google.com"
  },
  {
    id: "3",
    name: "Elizabeth Hoffman",
    email: "tellus.nunc@google.ca"
  },
  {
    id: "4",
    name: "Zelda Hess",
    email: "phasellus.libero.mauris@icloud.ca"
  }
];

const sampleColumns = [
  {
    "id": "name",
    "name": "Name",
  },
  {
    "id": "email",
    "name": "Email",
  },
];

const Database = createReactBlockSpec(
  {
    type: "database",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      data: {
        default: JSON.stringify(sampleData),
      },
      columns: {
        default: JSON.stringify(sampleColumns),
      }
    },
    content: "none",
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [rows, setRows] = useState(JSON.parse(props.block.props.data));

      return (
        <Table data={rows} columns={JSON.parse(props.block.props.columns)} licenseKey={EVALUATION_LICENSE} config={{}}
          onChange={async (event) => {
            if (event.type === "update_row") {
              const rowId = event.rowId;
              setRows((prevRows: [{id: string}]) => {
                const newRows = prevRows.map(row => {
                  if (row.id.toString() === rowId) {
                    return {...row, ...event.update}
                  } else {
                    return row;
                  }
                });

                props.editor.updateBlock(props.block, {
                  props: {
                    data: JSON.stringify(newRows),
                  },
                })
                return newRows;
              })
            } else if (event.type === "add_row") {
              setRows((prevRows: [{id: string}]) => {
                const newRows = [...prevRows, {id: event.rowId}];

                props.editor.updateBlock(props.block, {
                  props: {
                    data: JSON.stringify(newRows),
                  },
                })
                return newRows;
              })
            } else {
              console.log(event);
            }
          }}
        />
      );
    },
  }
);

export default Database;