"use client";

import * as React from "react";
import { forwardRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterInputPlaceholder?: string;
  filterColumnId?: string;
  dateFilterColumnId?: string;
  additionalFilters?: {
    columnId: string;
    placeholder: string;
  }[];
}

export interface DataTableRef {
  getSelectedRowModel: () => { rows: any[] };
}

export const DataTableClient = forwardRef<DataTableRef, DataTableProps<any, any>>(
  function DataTableClient<TData, TValue>(
    {
      columns,
      data,
      filterInputPlaceholder = "Filter...",
      filterColumnId,
      dateFilterColumnId,
      additionalFilters,
    }: DataTableProps<TData, TValue>,
    ref: React.ForwardedRef<DataTableRef>
  ) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
      data,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
      },
      filterFns: {
        dateRange: (row, columnId, filterValue: {from?: Date, to?: Date}) => {
          const date = new Date(row.getValue(columnId));
          const from = filterValue.from ? new Date(filterValue.from) : null;
          const to = filterValue.to ? new Date(filterValue.to) : null;
          
          if (from && to) {
            return date >= from && date <= to;
          } else if (from) {
            return date >= from;
          } else if (to) {
            return date <= to;
          }
          return true;
        },
      },
    });

    React.useImperativeHandle(ref, () => ({
      getSelectedRowModel: () => table.getSelectedRowModel()
    }));

    return (
      <div className="w-full">
        <div className="flex items-center py-4 gap-2 flex-wrap">
          {filterColumnId && (
            <Input
              placeholder={filterInputPlaceholder}
              value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
          {additionalFilters?.map((filter) => (
            <Input
              key={filter.columnId}
              placeholder={filter.placeholder}
              value={(table.getColumn(filter.columnId)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(filter.columnId)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          ))}
          {dateFilterColumnId && (
            <div className="flex gap-2">
              <DatePicker
                placeholder="From date"
                selected={(table.getColumn(dateFilterColumnId)?.getFilterValue() as {from?: Date})?.from}
                onChange={(date: Date | undefined) => {
                  const currentFilter = table.getColumn(dateFilterColumnId)?.getFilterValue() as {from?: Date, to?: Date} || {};
                  table.getColumn(dateFilterColumnId)?.setFilterValue({
                    ...currentFilter,
                    from: date
                  });
                }}
              />
              <DatePicker
                placeholder="To date"
                selected={(table.getColumn(dateFilterColumnId)?.getFilterValue() as {to?: Date})?.to}
                onChange={(date: Date | undefined) => {
                  const currentFilter = table.getColumn(dateFilterColumnId)?.getFilterValue() as {from?: Date, to?: Date} || {};
                  table.getColumn(dateFilterColumnId)?.setFilterValue({
                    ...currentFilter,
                    to: date
                  });
                }}
              />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
