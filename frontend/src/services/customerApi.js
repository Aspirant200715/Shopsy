import axiosInstance from "../axiosCalls/axios";

export const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await axiosInstance.patch("/customers/change-password", {
    oldPassword,
    newPassword,
  });

  return response.data;
};
