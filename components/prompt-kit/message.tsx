"use client";

import { Tooltip } from "@heroui/react";
import type React from "react";


import { Markdown } from "./markdown";

import { cn } from "@/lib/utils";


export type MessageProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
);

export type MessageContentProps = {
  children: React.ReactNode;
  markdown?: boolean;
  className?: string;
} & React.ComponentProps<typeof Markdown> &
  React.HTMLProps<HTMLDivElement>;

const MessageContent = ({ children, markdown = false, className, ...props }: MessageContentProps) => {
  const classNames = cn("rounded-2xl p-3 text-sm leading-relaxed break-words whitespace-normal", className);

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export type MessageActionsProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const MessageActions = ({ children, className, ...props }: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

const MessageAction = ({ tooltip, children, className, side = "top" }: MessageActionProps) => (
  <Tooltip delay={100}>
    <Tooltip.Trigger>{children}</Tooltip.Trigger>
    <Tooltip.Content className={cn("px-2 py-1 text-xs", className)} placement={side}>
      {tooltip}
    </Tooltip.Content>
  </Tooltip>
);

export { Message, MessageContent, MessageActions, MessageAction };
