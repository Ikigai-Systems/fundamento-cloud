import clsx from "clsx";
import {User} from "../types.js";

type AvatarUser = Pick<User, "displayName" | "avatarUrl">;

const userInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join("");

type UserAvatarProps = {
  user: AvatarUser;
  // Sets the size. The initials are an SVG, so they scale with it.
  className?: string;
};

// The React counterpart of the UserAvatar view component: the uploaded picture,
// or initials in a blue circle.
const UserAvatar = ({user, className}: UserAvatarProps) => (
  <span
    title={user.displayName}
    className={clsx("inline-flex shrink-0 overflow-hidden rounded-full bg-blue-500 text-white", className)}
  >
    {user.avatarUrl
      ? <img src={user.avatarUrl} alt="" className="size-full object-cover"/>
      : (
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
          <text x="50" y="50" dominantBaseline="central" textAnchor="middle" fontSize="42" fontWeight="bold" fill="currentColor">
            {userInitials(user.displayName ?? "")}
          </text>
        </svg>
      )}
  </span>
);

// A user in the slot ObjectIcon fills for documents and tables, so a user lines
// up with them in the @ menu and reads the same way inside a sentence. Until
// the user has loaded, or when it is gone, the slot holds a person glyph.
export const UserIcon = ({user}: {user?: AvatarUser | null}) => (
  <span className="object-icon" aria-hidden="true">
    {user ? <UserAvatar user={user} className="size-[1.1em]"/> : <i className="icon-[tabler--user]"/>}
  </span>
);

export default UserAvatar;
