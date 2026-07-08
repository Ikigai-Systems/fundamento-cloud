import AsyncSelect from "react-select/async";
import {SingleValue} from "react-select";
import UsersApi from "../../../api/UsersApi.js";
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {User} from "../../../types.ts";

type FocusState = "none" | "focused" | "editing";

type UserOption = {
  value: number | undefined;
  initials: string;
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
          <div className="flex flex-row items-center text-red-800">
            Unable to load user with id '{userId}'
          </div>
        );
      } else if (selectedUser === null) {
        return (<>
          <div className="flex flex-row items-center flex-grow h-8" onClick={() => {}}>
            {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
          </div>
        </>);
      } else {
        const initials = userQuery.data ? `${userQuery.data.firstName[0]}${userQuery.data.lastName[0]}` : userId ?? undefined;
        const displayName = userQuery.data ? `${userQuery.data.firstName} ${userQuery.data.lastName}` : userId ?? undefined;
        return (<>
          <div className="flex flex-row items-center flex-grow" onClick={() => {}}>
            <div title={displayName} className="w-6 h-6 m-1 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {initials}
            </div>
            {displayName}
            {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
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
          // value={{value: userId, initials: selectedUser.firstName[0] + selectedUser.lastName[0], displayName: `${selectedUser.firstName} ${selectedUser.lastName}`}}
          loadOptions={async (_query): Promise<UserOption[]> => {
            const emptyOption: UserOption = {
              value: undefined, initials: "n/a", displayName: "leave empty",
            };
            return [emptyOption].concat(
              (usersQuery.data ?? []).map((user): UserOption => ({
                value: user.id,
                initials: user.firstName[0] + user.lastName[0],
                displayName: `${user.firstName} ${user.lastName}`
              }))
            );
          }}
          formatOptionLabel={({value, initials, displayName}) => {
            if (!value) {
              return <div className="italic">Empty</div>
            }
            return (
              <div className="flex flex-row items-center ml-2">
                <div title={displayName} className="w-6 h-6 -m-2 mr-1 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {initials}
                </div>
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