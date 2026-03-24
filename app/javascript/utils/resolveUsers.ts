import queryClient from "../contextes/ReactQueryClient";
import UsersApi from "../api/UsersApi.js";
import type { User } from "../types";

const resolveUsers = async (userIds: string[]) => {
  const uncached = userIds.filter(
    (id) => !queryClient.getQueryData(["users", id])
  );

  if (uncached.length > 0) {
    const users: User[] = await UsersApi.index({ query: { user_ids: uncached } });
    users.forEach((user) => {
      queryClient.setQueryData(["users", user.id.toString()], user);
    });
  }

  return userIds.map((id) => {
    const user = queryClient.getQueryData<User>(["users", id]);
    return {
      id,
      username: user ? `${user.firstName} ${user.lastName}` : id,
    };
  });
};

export default resolveUsers;
