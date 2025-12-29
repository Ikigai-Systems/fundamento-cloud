import React from "react";
import AsyncSelect from "react-select/async";
import {useQueries, useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {join} from "lodash";
import UsersApi from "../../../api/UsersApi.js";
import {User} from "../../../types.ts";

function MultiPeopleSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}) {
  const usersQuery = useQuery<User>({queryKey: ["users"], queryFn: async () => {
    return (await UsersApi.index());
  }}, queryClient);

  const userIds: number[] = data ? data.split(",") : [];

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
        const initials = userQuery.data ? `${userQuery.data.firstName[0]}${userQuery.data.lastName[0]}` : undefined;
        const displayName = userQuery.data ? `${userQuery.data.firstName} ${userQuery.data.lastName}` : undefined;
        return (
          <div className="flex flex-row items-center" onClick={() => {}}>
            <div title={displayName} className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {initials}
            </div>
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
        {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
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
          value={selectedUsers.map((user: User) => ({ value: user.id, initials: user.firstName[0] + user.lastName[0], displayName: `${user.firstName} ${user.lastName}`}))}
          loadOptions={async (query) => {
            return usersQuery.data.map(user => ({
              value: user.id,
              initials: user.firstName[0] + user.lastName[0],
              displayName: `${user.firstName} ${user.lastName}`
            }));
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
          onChange={(newOption) => {
            const userIds = Array.from(newOption.values().map(value => value.value));

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