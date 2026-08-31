"use client";

import { Button, Input } from "@heroui/react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import React from "react";

export interface TableToolbarProps {
  /**
   * Live search query value
   */
  searchValue?: string;
  /**
   * Search input change callback
   */
  onSearchChange?: (val: string) => void;
  /**
   * Search input placeholder
   */
  searchPlaceholder?: string;
  /**
   * Refresh callback function
   */
  onRefresh?: () => void;
  /**
   * Indicates if data is currently refreshing/loading
   */
  isRefreshing?: boolean;
  /**
   * Callback to reset all search/filter controls
   */
  onClearFilters?: () => void;
  /**
   * Indicates if any filters/search are currently active
   */
  hasActiveFilters?: boolean;
  /**
   * Additional custom filter controls (e.g. Select dropdowns)
   */
  children?: React.ReactNode;
  /**
   * Optional custom right-aligned actions
   */
  actions?: React.ReactNode;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  onRefresh,
  isRefreshing = false,
  onClearFilters,
  hasActiveFilters = false,
  children,
  actions,
  className = "",
}: TableToolbarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface/50 border border-border-custom rounded-xl ${className}`}
    >
      {/* Search & Filter Controls Group */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {onSearchChange !== undefined && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs pl-8 pr-7 border border-border-custom bg-background-custom/30 rounded-lg text-text-primary"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-text-secondary hover:text-text-primary absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Custom filter select dropdowns / controls passed as children */}
        {children}

        {/* Reset Filters button */}
        {hasActiveFilters && onClearFilters && (
          <Button
            size="sm"
            variant="danger"
            onPress={onClearFilters}
            className="text-xs h-9 px-2.5 font-medium"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
          </Button>
        )}

        {/* Refresh Button in Filters Line */}
        {onRefresh && (
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isRefreshing}
            onPress={onRefresh}
            className="text-xs font-semibold h-9 px-3 bg-surface border border-border-custom hover:border-emerald-500/40 text-text-primary transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 text-emerald-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      </div>

      {/* Custom Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export interface TableFooterProps {
  /**
   * Current number of visible/filtered rows
   */
  showingCount?: number;
  /**
   * Total number of records available in backend/dataset
   */
  totalCount?: number;
  /**
   * Entity unit label (e.g. "users", "records", "requests", "logs")
   */
  entityLabel?: string;
  /**
   * Current rows per page limit
   */
  pageSize?: number;
  /**
   * Callback when page size is changed (10, 20, 50, 100)
   */
  onPageSizeChange?: (size: number) => void;
  /**
   * Selectable page size options list
   */
  pageSizeOptions?: number[];
  /**
   * Current page number (1-based)
   */
  page?: number;
  /**
   * Total number of pages
   */
  totalPages?: number;
  /**
   * Page change callback
   */
  onPageChange?: (newPage: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export function TableFooter({
  showingCount,
  totalCount,
  entityLabel = "items",
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  page,
  totalPages,
  onPageChange,
  className = "",
  children,
}: TableFooterProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface/50 border border-border-custom rounded-xl mt-3 ${className}`}
    >
      {/* Rows Per Page Selector & Extra Children */}
      <div className="flex flex-wrap items-center gap-3">
        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono bg-background-custom/60 px-2.5 py-1.5 rounded-lg border border-border-custom/60">
            <span className="text-[11px] whitespace-nowrap text-text-secondary">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent text-text-primary font-bold text-xs focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-surface text-text-primary">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Row Count Badge */}
        {(showingCount !== undefined || totalCount !== undefined) && (
          <div className="text-xs text-text-secondary font-mono bg-background-custom/60 px-2.5 py-1.5 rounded-lg border border-border-custom/60 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>
              Showing{" "}
              <strong className="text-text-primary font-bold">
                {showingCount !== undefined ? showingCount : 0}
              </strong>
              {totalCount !== undefined && totalCount !== showingCount && (
                <span>
                  {" "}
                  of <strong className="text-text-primary font-bold">{totalCount}</strong>
                </span>
              )}{" "}
              {entityLabel}
            </span>
          </div>
        )}

        {children}
      </div>

      {/* Optional Page Navigation Buttons */}
      {page !== undefined && totalPages !== undefined && onPageChange && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
            className="text-xs font-semibold h-8 px-2.5"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Previous
          </Button>
          <span className="text-xs font-mono text-text-secondary px-1">
            Page <strong className="text-text-primary font-bold">{page}</strong> of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => onPageChange(page + 1)}
            className="text-xs font-semibold h-8 px-2.5"
          >
            Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
