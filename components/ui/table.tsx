import { tableVariants } from "@heroui/styles";
import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: "primary" | "secondary";
}

export function Table({ children, className = "", variant, ...props }: TableProps) {
  const styles = tableVariants({ variant });
  return (
    <div className={styles.scrollContainer()}>
      <table className={`${styles.content()} ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableVariants();
  return (
    <thead className={`${styles.header()} ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableColumn({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableVariants();
  return (
    <th className={`${styles.column()} ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableVariants();
  return (
    <tbody className={`${styles.body()} ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  const styles = tableVariants();
  return (
    <tr className={`${styles.row()} ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableVariants();
  return (
    <td className={`${styles.cell()} ${className}`} {...props}>
      {children}
    </td>
  );
}
