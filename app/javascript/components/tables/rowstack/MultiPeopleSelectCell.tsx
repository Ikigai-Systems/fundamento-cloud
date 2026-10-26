import AsyncSelect from "react-select/async";
import {MultiValue} from "react-select";
import {useQueries, useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {join} from "lodash";
import UsersApi from "../../../api/UsersApi.js";
import {User} from "../../../types.ts";
import UserAvatar from "../../UserAvatar.tsx";

type FocusState = "none" | "focused" | "editing";

type UserOption = {
  value: number;
  avatarUrl?: string | null;
  displayName: string;
};

const userOption = (user: User): UserOption => ({
  value: user.id,
  avatarUrl: user.avatarUrl,
  displayName: user.displayName ?? `${user.firstName} ${user.lastName}`,
});

type MultiPeopleSelectCellProps = {
  data: string | null;
  setData: (value: string) => void;
  focusState: FocusState;
  setFocus: (focusState: FocusState) => void;
  isViewOnly: boolean;
};

function MultiPeopleSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}: MultiPeopleSelectCellProps) {
  const usersQuery = useQuery<User[]>({queryKey: ["users"], queryFn: async () => {
    return (await UsersApi.index());
  }}, queryClient);

  const userIds: string[] = data ? data.split(",") : [];

  const userQueries = useQueries({
    queries: userIds.map(userId => ({
      queryKey: ["users", userId],
      queryFn: async () => {
        if (!userId) {
          return null;
        }
        return (await UsersApi.show({id: userId}));
      }})),
  }, queryClient);

  const selectedUsers = userQueries
    .filter(userQuery => userQuery.isSuccess)
    .map(userQuery => userQuery.data);

  function renderSelectedUsers() {
    return userQueries.map(userQuery => {
      if (userQuery.isLoading) {
        return (
          <div className="pl-2">
            <Spinner size={4}/>
          </div>
        )
      } else if (userQuery.isError) {
        return (
          <div className="flex items-center border rounded text-red-800  px-1 truncate">
            Unable to load document
          </div>
        );
      } else if (userQuery.isSuccess) {
        return (
          <div className="flex flex-row items-center" onClick={() => {}}>
            {userQuery.data && <UserAvatar user={userQuery.data} className="size-6"/>}
          </div>
        );
      }
    })
  }

  if (focusState === "none") {
    return (
      <div className="h-8 flex flex-row items-center gap-0.5">
        <span/>
        {renderSelectedUsers()}
      </div>
    );
  } else if (focusState === "focused" || isViewOnly) {
    return (
      <div className="ml-0.5 h-8 flex flex-row items-center gap-0.5" onClick={() => !isViewOnly && setFocus("editing")}>
        {renderSelectedUsers()}
        {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] size-5 icon-[tabler--chevron-down]"></span>}
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
          isMulti={true}
          value={selectedUsers.flatMap((user): UserOption[] => user ? [userOption(user)] : [])}
          loadOptions={async (_query): Promise<UserOption[]> => {
            return (usersQuery.data ?? []).map(userOption);
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
          onChange={(newOption: MultiValue<UserOption>) => {
            const userIds = newOption.map(option => option.value);

            setData(join(userIds));
            setFocus("focused");
          }}
          styles={{
            indicatorSeparator: (base) => ({
              ...base,
              display: "none",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              display: "none",
            })
          }}
        />
      </div>
    );
  }
}

export default MultiPeopleSelectCell;