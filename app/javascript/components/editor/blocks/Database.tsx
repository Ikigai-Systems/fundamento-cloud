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
      const [columns, setColumns] = useState(JSON.parse(props.block.props.columns));

      return (
        <Table data={rows} columns={columns} licenseKey={EVALUATION_LICENSE} config={{}}
          onChange={async (event) => {
            if (event.type === "add_row") {
              setRows((prevRows: [{id: string}]) => {
                const nextRows = [...prevRows, {id: event.rowId}];

                props.editor.updateBlock(props.block, {
                  props: {
                    data: JSON.stringify(nextRows),
                  },
                })
                return nextRows;
              })
            } else if (event.type === "update_row") {
              setRows((prevRows: [{id: string}]) => {
                const nextRows = prevRows.map(row => {
                  if (row.id.toString() === event.rowId) {
                    return {...row, ...event.update}
                  } else {
                    return row;
                  }
                });

                props.editor.updateBlock(props.block, {
                  props: {
                    data: JSON.stringify(nextRows),
                  },
                })
                return nextRows;
              })
            } else if (event.type === "delete_rows") {
              setRows((prevRows: [{id: string}]) => {
                const nextRows = prevRows.filter(row => !event.rows[0].includes(row.id));

                props.editor.updateBlock(props.block, {
                  props: {
                    data: JSON.stringify(nextRows),
                  },
                })
                return nextRows;
              })
            } else if (event.type === "add_column") {
              setColumns((prevColumns: [{ id: string }]) => {
                const nextColumns = [...prevColumns, event.update];

                props.editor.updateBlock(props.block, {
                  props: {
                    columns: JSON.stringify(nextColumns),
                  },
                })

                return nextColumns;
              });
            } else if (event.type === "update_column") {
              setColumns((prevColumns: [{ id: string }]) => {
                const nextColumns = prevColumns.map(column => {
                  if (column.id.toString() === event.colId) {
                    return {...column, ...event.update}
                  } else {
                    return column;
                  }
                });

                props.editor.updateBlock(props.block, {
                  props: {
                    columns: JSON.stringify(nextColumns),
                  },
                })
                return nextColumns;
              })
            } else if (event.type === "delete_column") {
              setColumns((prevColumns: [{ id: string }]) => {
                const nextColumns = prevColumns.filter(column => column.id != event.colId);

                props.editor.updateBlock(props.block, {
                  props: {
                    columns: JSON.stringify(nextColumns),
                  },
                })

                return nextColumns;
              });
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