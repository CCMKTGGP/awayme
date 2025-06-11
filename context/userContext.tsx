"use client";
import { fetchData } from "@/utils/fetch";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  verifyToken?: string;
  verifyTokenExpire?: Date;
  numberOfRetries?: number;
  reset_password_token?: string;
  reset_password_expire?: Date;
  plan: {
    _id: string;
    planId: string;
    name: string;
    numberOfCalendarsAllowed: number;
  };
  timeZone: string;
}

const INITIAL_STATE: IUser = {
  _id: "",
  firstName: "",
  lastName: "",
  email: "",
  isVerified: false,
  plan: {
    _id: "",
    planId: "",
    name: "",
    numberOfCalendarsAllowed: 0,
  },
  timeZone: "",
};

const Context = createContext<{
  user: IUser;
  setUser: (user: IUser) => void;
  toggleFetchUserDetails: boolean;
  setToggleFetchUserDetails: (value: boolean) => void;
}>({
  user: INITIAL_STATE,
  setUser: () => {},
  toggleFetchUserDetails: false,
  setToggleFetchUserDetails: () => {},
});

const authPathNames = ["/login", "/register"];

export function UserContext({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const userId =
    (typeof window !== "undefined" && localStorage.getItem("userId")) ?? "";
  const [user, setUser] = useState<IUser>(INITIAL_STATE);
  const [toggleFetchUserDetails, setToggleFetchUserDetails] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>();

  useEffect(() => {
    async function getUserDetails(userId: string) {
      try {
        const response = await fetchData(`/api/users/${userId}`);
        const { data } = response;
        if (!data?.isVerified && !authPathNames.includes(pathname)) {
          router.push("/email-not-verified");
        }
        setUser(data);
      } catch (err: any) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      setIsLoading(true);
      getUserDetails(userId);
    }

    return () => {
      setIsLoading(false);
    };
  }, [userId, toggleFetchUserDetails]);

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        toggleFetchUserDetails,
        setToggleFetchUserDetails,
      }}
    >
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm leading-5 font-medium text-black text-center">
              Fetching user details. Please hang on a sec!
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}

export function useUserContext() {
  return useContext(Context);
}
