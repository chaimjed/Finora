import { useEffect, useState } from "react";
import { Avatar } from "flowbite-react";

interface UserAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_PX: Record<NonNullable<UserAvatarProps["size"]>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

export default function UserAvatar({ src, firstName = "", lastName = "", size = "md" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const px = SIZE_PX[size];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`.trim() || "User"}
        onError={() => setFailed(true)}
        style={{ width: px, height: px }}
        className="rounded-full object-cover"
      />
    );
  }

  return <Avatar placeholderInitials={initials} rounded size={size === "xl" ? "lg" : size} />;
}