/**
 * Reusable data-table module: a TanStack Table + shadcn <Table /> datagrid with
 * global search, sorting, column visibility, pagination, row selection, and
 * Excel export. Import from "@/components/dashboard/data-table".
 *
 * Typical usage:
 *   const columns: ColumnDef<Student>[] = [
 *     { accessorKey: "roll_no", header: ({ column }) =>
 *         <DataTableColumnHeader column={column} title="Roll no" />,
 *       meta: { label: "Roll no" } },
 *     ...
 *   ];
 *   <DataTable columns={columns} data={students} enableExport exportFileName="students" />
 */
export { DataTable, type DataTableProps } from "./DataTable";
export { DataTableColumnHeader } from "./DataTableColumnHeader";
export { DataTablePagination } from "./DataTablePagination";
export { DataTableViewOptions } from "./DataTableViewOptions";
export { exportToExcel, type ExportToExcelOptions } from "./export";
