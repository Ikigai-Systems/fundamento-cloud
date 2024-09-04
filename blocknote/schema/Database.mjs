import {defaultProps} from "@blocknote/core";
import {createReactBlockSpec} from "@blocknote/react";

const sampleData = [
  {
    id: "sample_row_1",
  },
  {
    id: "sample_row_2",
  },
  {
    id: "sample_row_3",
  },
];

const sampleColumns = [
  {
    id: "sample_column_name",
    name: "Name",
  },
  {
    id: "sample_column_2",
    name: "Column 2",
  },
  {
    id: "sample_column_3",
    name: "Column 3",
  },
  {
    id: "sample_column_4",
    name: "Notes",
    type: "longText",
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
  }, {
    toExternalHTML: ({block, editor}) => {
      const {props} = block;
      const data = JSON.parse(props.data);
      const columns = JSON.parse(props.columns);

      const tableRows = data.map(row => {
        const cells = columns.map(column => `<td>${row[column.id] || ""}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");

      const tableHeaders = columns.map(column => `<th>${column.name}</th>`).join("");

      return (
        `<table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>`
      );
    },
    parse: (htmlElement) => {
      throw new Error("To be implemented some day");
    }
  }
);

export default Database;

