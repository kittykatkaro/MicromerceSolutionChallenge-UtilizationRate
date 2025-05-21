import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

/**
 * Example of how a tableData object should be structured.
 *
 * Each `row` object has the following properties:
 * @prop {string} person - The full name of the employee.
 * @prop {number} past12Months - The value for the past 12 months.
 * @prop {number} y2d - The year-to-date value.
 * @prop {number} may - The value for May.
 * @prop {number} june - The value for June.
 * @prop {number} july - The value for July.
 * @prop {number} netEarningsPrevMonth - The net earnings for the previous month.
 */

// Get all month names from both employees and externals for variable table header
const allMonths = sourceData
  .flatMap(
    (row: any) =>
      row?.employees?.workforceUtilisation?.lastThreeMonthsIndividually ??
      row?.externals?.workforceUtilisation?.lastThreeMonthsIndividually ??
      []
  )
  .map((m: any) => m.month);
//Remove duplicates and sort by recent
const uniqueMonths = [...new Set(allMonths)].slice(0, 3);

const formatPercent = (val: string | number | undefined): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (!num || isNaN(num)) return "0%";
  return `${Math.round(num * 100)}%`;
};

const getMonthUtil = (month: string, dataRow: any): string => {
  const months =
    dataRow?.employees?.workforceUtilisation?.lastThreeMonthsIndividually ??
    dataRow?.externals?.workforceUtilisation?.lastThreeMonthsIndividually ??
    [];

  const val = months.find((m: any) => m.month === month)?.utilisationRate;
  return formatPercent(val);
};

const tableData: TableDataType[] = (
  sourceData as unknown as SourceDataType[]
).map((dataRow, index) => {
  const person = dataRow?.employees?.name ?? dataRow?.externals?.name ?? "–";
  const past12Months =
    dataRow?.employees?.workforceUtilisation?.utilisationRateLastTwelveMonths ??
    dataRow?.externals?.workforceUtilisation?.utilisationRateLastTwelveMonths ??
    "-";
  const y2d =
    dataRow?.employees?.workforceUtilisation?.utilisationRateYearToDate ??
    dataRow?.externals?.workforceUtilisation?.utilisationRateYearToDate ??
    "-";

  const monthlyValues: { [key: string]: string } = {};
  uniqueMonths.forEach((month) => {
    monthlyValues[month.toLowerCase()] = getMonthUtil(month, dataRow);
  });

  const getLatestEarnings = (dataRow: any): string => {
    const earningsList =
      dataRow.employees?.costsByMonth?.potentialEarningsByMonth ||
      dataRow.externals?.costsByMonth?.potentialEarningsByMonth ||
      [];

    if (!earningsList.length) return "–";

    let latest = earningsList[0];

    for (let i = 1; i < earningsList.length; i++) {
      if (earningsList[i].month > latest.month) {
        latest = earningsList[i];
      }
    }

    const value = parseFloat(latest.costs);
    return isNaN(value) ? "–" : value.toFixed(2) + " EUR";
  };

  const row: TableDataType = {
    person: `${person}`,
    past12Months: formatPercent(past12Months),
    y2d: formatPercent(y2d),
    ...monthlyValues,
    netEarningsPrevMonth: getLatestEarnings(dataRow),
  } as any;

  return row;
});

const Example = () => {
  // Static columns
  const staticColumns: MRT_ColumnDef<TableDataType>[] = [
    { accessorKey: "person", header: "Person" },
    { accessorKey: "past12Months", header: "Past 12 Months" },
    { accessorKey: "y2d", header: "YTD" },
  ];

  // Dynamic month columns
  const monthColumns = uniqueMonths.map((month) => ({
    accessorKey: month.toLowerCase(),
    header: month,
  }));

  // Final column
  const earningsColumn = {
    accessorKey: "netEarningsPrevMonth",
    header: "Net Earnings Prev Month",
  };

  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [...staticColumns, ...monthColumns, earningsColumn],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;
