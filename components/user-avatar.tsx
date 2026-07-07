import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, colorFromString, initials } from "@/lib/utils";

export function UserAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn(colorFromString(name))}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
