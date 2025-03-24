Formulas can be described and used as a language. In general, formulas are made up of two important components: Objects (and each object consists of values) and Arguments (and its describes what you want to do to the particular object)

Fundamento offers you a great deal of possibilities of processing your data. You can add formulas directly to the Documents,

Formulas can be used in following places:

*   In Table, as a Formula [column type](https://docs.fundamento.it/using-tables/column-types).
*   In Document, as a Button [block type](https://docs.fundamento.it/document-editor/block-types) action.
*   In Table, as a Button [column type](https://docs.fundamento.it/using-tables/column-types) action.
*   In a Webtrigger [automation](https://docs.fundamento.it/guide/automations) action.

Examples of the most used formulas:

*   Filter () - filter the particular set of data based on specific criteria

You’ll use the Filter formula when you want to use at part of a Table to answer a question. The criteria for this formula can be as simple or as complex as you need.

Filter(Table("table you want to look at"), "criteria matching the part you're interested in")

*   If () The If formula allows you to handle if/then logic. The basic structure of the If() formula is as follows:

If(Condition, "What you want to happen if this condition is true", "What you want to happen if this condition is false")

*   CurrentRow

In Fundamento tables are in fact databases the smallest unit is a row (unlike in the classic spreadsheets). Working with rows, you’re able to access all of the contextual details for each value (aka columns or attributes of the row).

For example, initial extractions might look like:

```javascript
First(CurrentRow("First Name")) + First(CurrentRow("Last Name"))
```

Other popular formulas that can be used in Fundamento:

*   Find
*   Sum
*   List
*   First
*   Last
*   ForEach
*   All
*   Any
*   And
*   Not
*   Or
*   True
*   False
*   Join
*   Concatenate
*   Substring
*   ContainsText
*   EndsWith
*   StartsWith
*   Substitute
*   Upper
*   Lower
*   Number
*   Dig
*   Equals

More information about what you can achieve with Formulas in Fundamento, you'll find in our Technical Documentation <https://docs.fundamento.it/formulas/reference>

**Formulas in the Text:**

You can also use Formulas in a text. When you want to use a formula in the document, then you are supposed to click "+" (on the left hand side, before this text) or type just "/" and choose "Formula" on the bottom of the list, then something like this appears:

[]

As you hover over this area you'll see this:

![1.jpg](attachment:431)

As you click on it that view will appear - now you can add a formula

![Add formula.jpg](attachment:432)

For example, as you use following formula:

![BlockNote image](https://fundamento.cloud/attachments/154)

you will get an answer:

100

**Formulas in a table:**

First you have to create a blank table using "+" (on the left hand side, before this text) or type just "/" and choose "Grid table"

|   |   |   |   |
| - | - | - | - |
|   |   |   |   |
|   |   |   |   |

As you can see, when you hover a mouse over the table you can see that you can easily add rows and colums (using "+") in order to make the table more useful

**Grid Table: Customer their first full month of sales**

Example:

|          |         |       |                |                    |               |
| -------- | ------- | ----- | -------------- | ------------------ | ------------- |
| Customer | Month   | Sales | CustomerSucces | Acquisition source | Sales figures |
| ABI      | 01.2024 | Cris  | Aga            | Marketing Lead     | 100000        |
| BEBI     | 01.2024 | Pati  | Phil           | Partner reco       | 590000        |
| CEBU     | 01.2024 | Cris  | Phil           | Partner reco       | 59000         |
| KICK     | 01.2024 | Pati  | Phil           | Marketing Lead     | 123000        |
| KILT     | 01.2024 | Pati  | Doris          | Marketing Lead     | 45000         |

You can also crreate an Advanced Table

Example:

Advanced Table: Customer their first full month of sales

_<todo: create advanced table in .blocknote.json file manually>_

**Formulas in the table details:**

**Description**\
Outputs contents of a Fundamento Table in a form of JSON representation.

Rows from that Table will be converted to an array of objects, and each object consists of values of that row for the table columns.

Objects will have duplicate key-value entries: one using column display name, and second using immutable identifier of the column (i.e. `{"First Name": "Cris", "9IJo5SGMLL": "Cris"}`).\
**Arguments**\
`tableId` - An identifier representing uniquely the Table in the Space. For your convenience, Table name can be used as well.\
**Examples**\
`Table("Invoices")`→`[{"Invoice No": "PITU/01/2024", "First Name": "Cris", "Sale Date": "05/01/2024", "IAmount": 100000}]`

### CurrentRow (columnId)

**Description**\
Outputs contents of a specific cell for a current row. Use it in a Formula column types - elsewhere `CurrentRow` will be invalid.\
**Arguments**\
`columnId` - An identifier representing uniquely the Column in the Table. For your convenience, Column name can be used as well.\
**Examples**\
`CurrentRow("First Name"")`→`"Cris"`

### AddRow (tableId, columnId, columnValue) `ACTION`

**Description**\
Adds a new row to a Fundamento Table. Optionally can fill value(s) in specified column(s).\
**Arguments**\
`tableId` - An identifier representing uniquely the Table in the Space. For your convenience, Table name can be used as well.\
`columnId...` - An identifier representing uniquely the Column in the Table. For your convenience, Column name can be used as well.\
`columnValue...` - value to use for specified Column when creating new Row.\
**Examples**\
`AddRow("Invoices", "Sale Date", "05/01/2024")`

### AddOrUpdateRow (tableId, criteria, columnId, columnValue) `ACTION`

**Description**\
Modifies all rows in a Fundamento Table matching the criteria. If no match is found, a new row will be inserted to Table.\
**Arguments**\
`tableId` - An identifier representing uniquely the Table in the Space. Table name can be used as well.\
`criteria` - Expression to select the rows for update\
`columnId` - An identifier representing uniquely the Column in the Table. Column name can be used as well.\
`columnValue` - value to use for specified Column when creating new Row.\
**Examples**\
`AddOrUpdateRow("Invoices", CurrentRow("Sale Date") == "05/01/2024", "Sale Date", "05/01/2024")`

### DeleteRows (tableId) `ACTION`

**Description**\
Removes all rows from a Fundamento Table, effectively clearing it.\
**Arguments**\
`tableId` - An identifier representing uniquely the Table in the Space. Table name can be used as well.\
**Examples**\
`RemoveRows("Invoices")`

### RunActions (actions…) `ACTION`

**Examples**\
`RunActions(RemoveRows("Invoices"), AddRow("Invoices", "Name", "Sample initial invoice"))`
