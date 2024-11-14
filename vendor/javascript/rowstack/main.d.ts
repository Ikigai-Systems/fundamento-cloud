import { default as default_2 } from 'react';
import { EVALUATION_LICENSE } from '../utils/license.js';
import { JSX as JSX_2 } from 'react/jsx-runtime';

declare interface AddRowConfig {
    enabled: boolean;
    body: boolean;
    toolbar: boolean;
}

export declare interface Column {
    id: string;
    name: string;
    width: number;
    type: ColumnTypeKey;
    isVisible: boolean;
    options: Array<Option_2>;
    isEditable: boolean;
    isViewOnly: boolean;
    renderer: any;
}

export declare interface ColumnType {
    type: ColumnTypeKey | string;
    cell: default_2.ElementType;
    icon: default_2.ElementType;
    name: string;
}

export declare enum ColumnTypeKey {
    Number = "number",
    Text = "text",
    LongText = "longText",
    Select = "select",
    Date = "date",
    MultiSelect = "multiSelect",
    Checkbox = "checkbox",
    Custom = "custom"
}

export declare interface Config {
    theme: Partial<ThemeConfig>;
    toolbar: FeatureConfig;
    addRow: Partial<AddRowConfig>;
    addColumn: FeatureConfig;
    readOnly: FeatureConfig;
    selectRow: FeatureConfig;
    editColumns: FeatureConfig;
    deleteColumns: FeatureConfig;
    hideFields: FeatureConfig;
    rowHeight: FeatureConfig;
    footer: FeatureConfig;
    filtering: FeatureConfig;
    sorting: FeatureConfig;
    grouping: FeatureConfig;
    extraColumnTypes: ColumnType[];
    extraColumnHeaderPopupActions: PopupAction[];
    parseDate: (value: string, configuration: {}) => any | Date;
    formatStoredDate: (parsedData: Date, configuration: {}) => string;
    formatDisplayDate: (parsedData: Date, configuration: {}) => string;
    parseNumber: (value: string | null | undefined, configuration: {}) => number | null;
    formatDisplayNumber: (parsedData: number | null, configuration: {}) => string;
}

export declare interface Data {
    id: string;
    [key: string]: string;
}

export { EVALUATION_LICENSE }

export declare interface FeatureConfig {
    enabled: boolean;
}

declare interface Option_2 {
    name: string;
    value: string;
    color: string;
}
export { Option_2 as Option }

export declare interface PopupAction {
    section: "main" | "actions1" | "actions2";
    menuItem: default_2.ReactNode;
    popup?: default_2.ReactNode;
}

declare function Table({ data, columns, onChange, config, licenseKey, }: {
    data: Array<Data>;
    columns: Array<Partial<Column>>;
    onChange: (x: any) => void;
    config: Partial<Config>;
    licenseKey: string;
}): JSX_2.Element;
export default Table;

export declare interface ThemeConfig {
    color: string;
}

export { }
