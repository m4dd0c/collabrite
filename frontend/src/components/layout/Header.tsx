import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { HashLink } from "react-router-hash-link";
import { Dispatch, SetStateAction } from "react";

const Header = ({
  auth,
  userId,
  setAuth,
}: {
  auth: boolean;
  setAuth: Dispatch<SetStateAction<boolean>>;
  userId: string | null;
}) => {
  const { pathname } = useLocation();
  // Regular expression to match /room/:id and /room/:id/<anything> but not /room/join or /room/create, with optional trailing slash
  const roomIdPattern = /^\/room\/(?!join$)(?!create$)([\w-]+)(\/.*)?$/;
  let isRoomPath = false;
  if (roomIdPattern.test(pathname)) {
    isRoomPath = true;
  } else {
    isRoomPath = false;
  }
  return (
    <>
      <div
        className={`${isRoomPath && "hidden"} h-[5rem] fixed z-[1] text-white max-sm:hidden`}
      >
        <div className="flex justify-between items-center">
          <HashLink
            className="flex justify-start items-center"
            smooth
            to="/#hero"
          >
            <img src="/assets/logo.png" alt="logo" height={80} width={80} />
            <h1 className="font-bold text-2xl max-lg:hidden">Collabrite</h1>
          </HashLink>
        </div>
      </div>
      <Navbar
        userId={userId}
        isRoomPath={isRoomPath}
        auth={auth}
        setAuth={setAuth}
      />
    </>
  );
};
export default Header;
