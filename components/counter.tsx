"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

export const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <Button className="rounded-full" onPress={() => setCount(count + 1)}>
      Count is {count}
    </Button>
  );
};
