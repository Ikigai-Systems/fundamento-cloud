import clsx from "clsx";
import ObjectIcon from "./ObjectIcon.tsx";
import {UserIcon} from "./UserAvatar.tsx";
import {referenceFailure} from "../utils/referenceFailure.ts";

type ReferenceType = "document" | "table" | "user";

const DELETED_LABELS: Record<ReferenceType, string> = {
  document: "Deleted document",
  table: "Deleted table",
  user: "Deleted user",
};

const TypeIcon = ({type}: {type: ReferenceType}) => {
  switch (type) {
    case "user":
      return <UserIcon/>;
    case "document":
      return <ObjectIcon type="Document"/>;
    case "table":
      return <ObjectIcon type="Table"/>;
  }
};

type BrokenReferenceProps = {
  // "Document" from an object reference, "document" from a mention's entity.
  type: string;
  // The name the reference remembers; without one it reads "Deleted <type>".
  title?: string;
  className?: string;
};

// A reference to something that is gone, drawn the same in documents and tables.
export const BrokenReference = ({type, title, className}: BrokenReferenceProps) => {
  const referenceType = type.toLowerCase() as ReferenceType;
  return (
    <span className={clsx("mention mention--broken", className)} title={`Broken ${referenceType} link`}>
      <TypeIcon type={referenceType}/>
      {title || DELETED_LABELS[referenceType]}
    </span>
  );
};

// A reference to something that exists but that the viewer may not open. Its name
// stays hidden, so the lozenge doesn't give away what is behind it.
export const RestrictedReference = ({type, className}: Omit<BrokenReferenceProps, "title">) => {
  const referenceType = type.toLowerCase() as ReferenceType;
  return (
    <span className={clsx("mention mention--restricted", className)} title={`You don't have access to this ${referenceType}`}>
      <i className="icon-[tabler--lock]" aria-hidden="true"/>
      No access
    </span>
  );
};

// The lozenge for a lookup that failed: deleted, no access, or (for anything else,
// such as the network, once its retries ran out) the broken look without claiming
// the object was deleted.
export const FailedReference = ({type, error, title, className}: BrokenReferenceProps & {error: unknown}) => {
  switch (referenceFailure(error)) {
    case "restricted":
      return <RestrictedReference type={type} className={className}/>;
    case "missing":
      return <BrokenReference type={type} title={title} className={className}/>;
    case "failed":
      return <BrokenReference type={type} title={title || `Unavailable ${type.toLowerCase()}`} className={className}/>;
  }
};
