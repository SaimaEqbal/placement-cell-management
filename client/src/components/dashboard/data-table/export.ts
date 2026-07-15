import * as XLSX from "xlsx";
import type { Table, Column, RowData } from "@tanstack/react-table";

/**
 * Column-meta augmentation shared by the data-table module. `label` names the
 * column in the Excel export (and the column-visibility menu); `align` right/
 * center-aligns a cell; `exportValue` overrides how a cell serialises to Excel
 * (e.g. formatting a date or mapping an enum to a human label).
 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    align?: "left" | "right" | "center";
    exportValue?: (row: TData) => string | number | boolean | null | undefined;
  }
}

/** A column that carries real data (i.e. not the select checkbox or an actions menu). */
function isDataColumn<TData>(column: Column<TData>): boolean {
  if (column.id === "select" || column.id === "actions") return false;
  // Only columns with an accessor (or an explicit export override) hold data.
  return column.getIsVisible() && (column.accessorFn != null || column.columnDef.meta?.exportValue != null);
}

/** Human label for a column: its meta.label, else a string header, else its id. */
function columnLabel<TData>(column: Column<TData>): string {
  const meta = column.columnDef.meta;
  if (meta?.label) return meta.label;
  const header = column.columnDef.header;
  if (typeof header === "string") return header;
  return column.id;
}

export interface ExportToExcelOptions {
  /** File name without extension. Defaults to "export". */
  fileName?: string;
  /** Worksheet/tab name. Defaults to "Sheet1". */
  sheetName?: string;
  /** Export only the selected rows when any are selected. Defaults to true. */
  selectedOnly?: boolean;
}

/**
 * Purpose: export a TanStack table's current rows to a real .xlsx file, honouring
 * the active filters, sort order, and column visibility. Uses each data column's
 * underlying value (not its rendered JSX), so badges/links export as plain text.
 * If rows are selected and `selectedOnly` is left on, only those are exported.
 */
export function exportToExcel<TData>(
  table: Table<TData>,
  { fileName = "export", sheetName = "Sheet1", selectedOnly = true }: ExportToExcelOptions = {},
): void {
  const dataColumns = table.getVisibleFlatColumns().filter(isDataColumn);
  const headers = dataColumns.map(columnLabel);

  const selected = table.getFilteredSelectedRowModel().rows;
  const rows =
    selectedOnly && selected.length > 0 ? selected : table.getSortedRowModel().rows;

  const aoa: Array<Array<string | number | boolean | null>> = [headers];
  for (const row of rows) {
    aoa.push(
      dataColumns.map((column) => {
        const exportValue = column.columnDef.meta?.exportValue;
        const value = exportValue ? exportValue(row.original) : row.getValue(column.id);
        if (value == null) return "";
        if (typeof value === "object") return String(value);
        return value as string | number | boolean;
      }),
    );
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
