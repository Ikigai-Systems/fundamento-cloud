import { EVALUATION_LICENSE } from '../utils/license.js';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { default as React_2 } from 'react';

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
    cell: React_2.ElementType;
    icon: React_2.ElementType;
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
    section: "main" | "filtering" | "actions";
    menuItem: React_2.ReactNode;
    popup?: React_2.ReactNode;
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
