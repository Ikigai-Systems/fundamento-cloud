import AsyncSelect from "react-select/async";
import {SingleValue} from "react-select";
import UsersApi from "../../../api/UsersApi.js";
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {User} from "../../../types.ts";
import UserAvatar from "../../UserAvatar.tsx";
import {FailedReference} from "../../BrokenReference.tsx";

type FocusState = "none" | "focused" | "editing";

type UserOption = {
  value: number | undefined;
  avatarUrl?: string | null;
  displayName: string;
};

type PeopleSelectCellProps = {
  data: string | null;
  setData: (value: number | undefined) => void;
  focusState: FocusState;
  setFocus: (focusState: FocusState) => void;
  isViewOnly: boolean;
};

function PeopleSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}: PeopleSelectCellProps) {
  const usersQuery = useQuery<User[]>({queryKey: ["users"], queryFn: async () => {
    return (await UsersApi.index());
  }}, queryClient);
  const userId = data;
  const userQuery = useQuery<User | null>({queryKey: ["users", userId], queryFn: async () => {
    if (!userId) {
      return null;
    }
    return (await UsersApi.show({id: userId}));
  }}, queryClient);
  const selectedUser = userQuery.data;

  function renderUserQuery() {
    if (userQuery.isLoading) {
      return (<div className="pl-2">
        <Spinner size={4}/>
      </div>)
    } else {
      if (userQuery.isError) {
        return (
          <div className="flex flex-row items-center flex-grow">
            <FailedReference type="user" error={userQuery.error} className="truncate"/>
            {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] size-5 icon-[tabler--chevron-down]"></span>}
          </div>
        );
      } else if (selectedUser === null) {
        return (<>
          <div className="flex flex-row items-center flex-grow h-8" onClick={() => {}}>
            {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] size-5 icon-[tabler--chevron-down]"></span>}
          </div>
        </>);
      } else {
        const displayName = userQuery.data?.displayName ?? userId ?? undefined;
        return (<>
          <div className="flex flex-row items-center flex-grow" onClick={() => {}}>
            {userQuery.data && <UserAvatar user={userQuery.data} className="size-6 m-1"/>}
            {displayName}
            {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] size-5 icon-[tabler--chevron-down]"></span>}
          </div>
        </>);
      }
    }
  }

  if (focusState === "none") {
    return (
      <div className="h-8 flex flex-row items-center">
        <span/>
        {renderUserQuery()}
      </div>
    );
  } else if (focusState === "focused" || isViewOnly) {
    return (
      <div className="h-8 flex flex-row items-center" onClick={() => !isViewOnly && setFocus("editing")}>
        {renderUserQuery()}
      </div>
    );
  } else if (focusState === "editing" && !isViewOnly) {
    return (
      <div className="-mt-1">
        <AsyncSelect
          className="fundamento-react-select-container"
          classNamePrefix="fundamento-react-select"
          menuIsOpen={true}
          autoFocus
          cacheOptions
          defaultOptions
          loadOptions={async (_query): Promise<UserOption[]> => {
            const emptyOption: UserOption = {
              value: undefined, displayName: "leave empty",
            };
            return [emptyOption].concat(
              (usersQuery.data ?? []).map((user): UserOption => ({
                value: user.id,
                avatarUrl: user.avatarUrl,
                displayName: user.displayName ?? `${user.firstName} ${user.lastName}`
              }))
            );
          }}
          formatOptionLabel={({value, avatarUrl, displayName}) => {
            if (!value) {
              return <div className="italic">Empty</div>
            }
            return (
              <div className="flex flex-row items-center ml-2">
                <UserAvatar user={{displayName, avatarUrl}} className="size-6 -m-2 mr-1"/>
                {displayName}
              </div>
            )}
          }
          onChange={(newOption: SingleValue<UserOption>) => {
            setData(newOption?.value);
            setFocus("focused");
          }}
        />
      </div>
    );
  }
}

export default PeopleSelectCell;