"use client";

import { Button } from "./button";

type Props = React.ComponentProps<typeof Button> & { message: string };

/** Submit button that asks for confirmation first. */
export function ConfirmSubmit({ message, onClick, ...props }: Props) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
        else onClick?.(e);
      }}
    />
  );
}
