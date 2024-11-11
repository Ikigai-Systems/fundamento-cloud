import React from "react";
import AsyncSelect from "react-select/async";
import UsersApi from "../../../api/UsersApi.js";
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";

function PeopleSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}) {
  const usersQuery = useQuery({queryKey: ["users"], queryFn: async () => {
    return (await UsersApi.index());
  }}, queryClient);
  const userId = data;
  const userQuery = useQuery({queryKey: ["users", userId], queryFn: async () => {
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
            {focusState === "focused" && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
          </div>
        </>);
      } else {
        const initials = userQuery.data ? `${userQuery.data.firstName[0]}${userQuery.data.lastName[0]}` : userId;
        const displayName = userQuery.data ? `${userQuery.data.firstName} ${userQuery.data.lastName}` : userId;
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
  } else if (focusState === "focused") {
    return (
      <div className="h-8 flex flex-row items-center" onClick={() => !isViewOnly && setFocus("editing")}>
        {renderUserQuery()}
      </div>
    );
  } else if (focusState === "editing" && !isViewOnly) {
    return (
      <div className="-mt-1">
        <AsyncSelect
          menuIsOpen={true}
          autoFocus
          cacheOptions
          defaultOptions
          // value={{value: userId, initials: selectedUser.firstName[0] + selectedUser.lastName[0], displayName: `${selectedUser.firstName} ${selectedUser.lastName}`}}
          loadOptions={async (query) => {
            return [{
              value: undefined, initials: "n/a", displayName: "leave empty",
            }].concat(
              usersQuery.data.map(user => ({value: user.id, initials: user.firstName[0] + user.lastName[0], displayName: `${user.firstName} ${user.lastName}`}))
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
          onChange={(newOption) => {
            setData(newOption.value);
            setFocus("focused");
          }}
          styles={{
            input: (base) => ({
              ...base,
              "input:focus": {
                boxShadow: "none",
              },
            }),
          }}
        />
      </div>
    );
  }
}

export default PeopleSelectCell;