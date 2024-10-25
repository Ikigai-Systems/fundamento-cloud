import React from "react";
import AsyncSelect from "react-select/async";
import UsersApi from "../../../api/UsersApi.js";
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";

function PeopleSelectCell({
  data,
  setData,
  focusState,
  setFocus,
}) {
  const usersQuery = useQuery({queryKey: ["users"], queryFn: async () => {
    return (await UsersApi.index());
  }}, queryClient);
  const userId = data;
  const userQuery = useQuery({queryKey: ["users", userId], queryFn: async () => {
    if (userId === null) {
      return null;
    }
    return (await UsersApi.show({id: userId}));
  }}, queryClient);
  const selectedUser = userQuery.data;

  if (focusState !== "editing") {
    if (userQuery.isLoading) {
      return (
        <span className="relative top-1">
          <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
        </span>
      )
    } else {
      if (userQuery.isError) {
        return (
          <div className="flex flex-row items-center text-red-800">
            Unable to load user with id '{userId}'
          </div>
        );
      } else if (selectedUser === null) {
        return null;
      } else {
        const initials = userQuery.data ? `${userQuery.data.firstName[0]}${userQuery.data.lastName[0]}` : userId;
        const displayName = userQuery.data ? `${userQuery.data.firstName} ${userQuery.data.lastName}` : userId;
        return (
          <div className="flex flex-row items-center" onClick={() => {

          }}>
            <div title="Roman Tyczny" className="w-6 h-6 m-1 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {initials}
            </div>
            {displayName}
          </div>
        );
      }
    }
  } else {
    return (
      <AsyncSelect
        autoFocus
        cacheOptions
        defaultOptions
        loadOptions={async (query) => {
          return usersQuery.data.map(user => ({value: user.id, initials: user.firstName[0]+user.lastName[0], displayName: `${user.firstName} ${user.lastName}`}));
        }}
        formatOptionLabel={({initials, displayName}) => (
          <div className="flex flex-row items-center">
            <div title={displayName} className="w-6 h-6 -m-2 mr-1 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {initials}
            </div>
            {displayName}
          </div>
        )}
        onChange={(newOption) => {
          setData(newOption.value);
          setFocus("focused");
        }}
      />
    );
  }
}

export default PeopleSelectCell;